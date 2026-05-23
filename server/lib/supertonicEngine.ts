/**
 * Native Supertonic 3 TTS inference engine.
 * TypeScript port of the official Node.js helper.js from supertone-inc/supertonic.
 *
 * Uses onnxruntime-node directly (bypassing sherpa-onnx) so we can expose
 * totalStep and named voice styles (M1-F5) as first-class parameters.
 */

import fs from 'fs';
import path from 'path';
import * as ort from 'onnxruntime-node';
import type { VoiceStyleId } from './supertonicVoices';

// ─── Config ──────────────────────────────────────────────────────────────────

interface TtsConfig {
    ae: { sample_rate: number; base_chunk_size: number };
    ttl: { chunk_compress_factor: number; latent_dim: number };
}

// ─── Text processing ─────────────────────────────────────────────────────────

const AVAILABLE_LANGS = [
    'en', 'ko', 'ja', 'ar', 'bg', 'cs', 'da', 'de', 'el', 'es',
    'et', 'fi', 'fr', 'hi', 'hr', 'hu', 'id', 'it', 'lt', 'lv',
    'nl', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sv', 'tr', 'uk', 'vi', 'na',
];

class UnicodeProcessor {
    private indexer: number[];

    constructor(unicodeIndexerPath: string) {
        this.indexer = JSON.parse(fs.readFileSync(unicodeIndexerPath, 'utf8')) as number[];
    }

    private _preprocessText(text: string, lang: string): string {
        text = text.normalize('NFKD');

        // Remove emojis
        const emojiPattern =
            /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]+/gu;
        text = text.replace(emojiPattern, '');

        const replacements: Record<string, string> = {
            '–': '-', '‑': '-', '—': '-', '_': ' ',
            '“': '"', '”': '"', '‘': "'", '’': "'",
            '´': "'", '`': "'", '[': ' ', ']': ' ', '|': ' ',
            '/': ' ', '#': ' ', '→': ' ', '←': ' ',
        };
        for (const [k, v] of Object.entries(replacements)) {
            text = text.replaceAll(k, v);
        }

        text = text.replace(/[♥☆♡©\\]/g, '');

        const exprReplacements: Record<string, string> = {
            '@': ' at ', 'e.g.,': 'for example, ', 'i.e.,': 'that is, ',
        };
        for (const [k, v] of Object.entries(exprReplacements)) {
            text = text.replaceAll(k, v);
        }

        text = text.replace(/ ,/g, ',').replace(/ \./g, '.').replace(/ !/g, '!')
            .replace(/ \?/g, '?').replace(/ ;/g, ';').replace(/ :/g, ':').replace(/ '/g, "'");

        while (text.includes('""')) text = text.replace('""', '"');
        while (text.includes("''")) text = text.replace("''", "'");
        while (text.includes('``')) text = text.replace('``', '`');

        text = text.replace(/\s+/g, ' ').trim();

        if (!/[.!?;:,'")\]}…。」』】〉》›»]$/.test(text)) {
            text += '.';
        }

        if (!AVAILABLE_LANGS.includes(lang)) {
            throw new Error(`Unsupported language: ${lang}. Available: ${AVAILABLE_LANGS.join(', ')}`);
        }

        return `<${lang}>${text}</${lang}>`;
    }

    call(textList: string[], langList: string[]): { textIds: number[][]; textMask: number[][][] } {
        const processedTexts = textList.map((t, i) => this._preprocessText(t, langList[i]));
        const textIdsLengths = processedTexts.map(t => t.length);
        const maxLen = Math.max(...textIdsLengths);

        const textIds: number[][] = [];
        for (let i = 0; i < processedTexts.length; i++) {
            const row = new Array(maxLen).fill(0);
            const chars = Array.from(processedTexts[i]);
            for (let j = 0; j < chars.length; j++) {
                row[j] = this.indexer[chars[j].charCodeAt(0)] ?? 0;
            }
            textIds.push(row);
        }

        const textMask = lengthToMask(textIdsLengths);
        return { textIds, textMask };
    }
}

// ─── Mask helpers ────────────────────────────────────────────────────────────

function lengthToMask(lengths: number[], maxLen?: number): number[][][] {
    const ml = maxLen ?? Math.max(...lengths);
    return lengths.map(len => {
        const row: number[] = [];
        for (let j = 0; j < ml; j++) row.push(j < len ? 1.0 : 0.0);
        return [row]; // [B, 1, maxLen]
    });
}

function getLatentMask(wavLengths: number[], baseChunkSize: number, chunkCompressFactor: number): number[][][] {
    const latentSize = baseChunkSize * chunkCompressFactor;
    const latentLengths = wavLengths.map(len => Math.floor((len + latentSize - 1) / latentSize));
    return lengthToMask(latentLengths);
}

// ─── Tensor helpers ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function arrayToTensor(array: any, dims: number[]): ort.Tensor {
    const flat: number[] = Array.from({ length: 0 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flatten = (a: any): void => {
        if (Array.isArray(a)) a.forEach(flatten);
        else flat.push(a as number);
    };
    flatten(array);
    return new ort.Tensor('float32', Float32Array.from(flat), dims);
}

function intArrayToTensor(array: number[][], dims: number[]): ort.Tensor {
    const flat: bigint[] = [];
    for (const row of array) for (const v of row) flat.push(BigInt(v));
    return new ort.Tensor('int64', BigInt64Array.from(flat), dims);
}

// ─── Voice style ─────────────────────────────────────────────────────────────

interface StyleTensors { ttl: ort.Tensor; dp: ort.Tensor }

function loadVoiceStyleJson(filePath: string): StyleTensors {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const voiceStyle = JSON.parse(fs.readFileSync(filePath, 'utf8')) as any;

    const ttlDims: number[] = voiceStyle.style_ttl.dims;  // [1, d1, d2]
    const dpDims: number[]  = voiceStyle.style_dp.dims;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ttlFlat = Float32Array.from((voiceStyle.style_ttl.data as any[]).flat(Infinity) as number[]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dpFlat  = Float32Array.from((voiceStyle.style_dp.data  as any[]).flat(Infinity) as number[]);

    return {
        ttl: new ort.Tensor('float32', ttlFlat, ttlDims),
        dp:  new ort.Tensor('float32', dpFlat,  dpDims),
    };
}

// ─── Text chunking ───────────────────────────────────────────────────────────

function chunkText(text: string, maxLen = 300): string[] {
    const paragraphs = text.trim().split(/\n\s*\n+/).filter(p => p.trim());
    const chunks: string[] = [];

    for (let paragraph of paragraphs) {
        paragraph = paragraph.trim();
        if (!paragraph) continue;

        const sentences = paragraph.split(
            /(?<!Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sr\.|Jr\.|Ph\.D\.|etc\.|e\.g\.|i\.e\.|vs\.|Inc\.|Ltd\.|Co\.|Corp\.|St\.|Ave\.|Blvd\.)(?<!\b[A-Z]\.)(?<=[.!?])\s+/
        );

        let currentChunk = '';
        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length + 1 <= maxLen) {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
            } else {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = sentence;
            }
        }
        if (currentChunk) chunks.push(currentChunk.trim());
    }

    return chunks;
}

// ─── Main TTS class ──────────────────────────────────────────────────────────

class SupertonicTTSEngine {
    private cfg: TtsConfig;
    private textProcessor: UnicodeProcessor;
    private dpOrt: ort.InferenceSession;
    private textEncOrt: ort.InferenceSession;
    private vectorEstOrt: ort.InferenceSession;
    private vocoderOrt: ort.InferenceSession;
    private voiceStyles: Map<string, StyleTensors>;
    readonly sampleRate: number;

    constructor(
        cfg: TtsConfig,
        textProcessor: UnicodeProcessor,
        dpOrt: ort.InferenceSession,
        textEncOrt: ort.InferenceSession,
        vectorEstOrt: ort.InferenceSession,
        vocoderOrt: ort.InferenceSession,
        voiceStyles: Map<string, StyleTensors>,
    ) {
        this.cfg = cfg;
        this.textProcessor = textProcessor;
        this.dpOrt = dpOrt;
        this.textEncOrt = textEncOrt;
        this.vectorEstOrt = vectorEstOrt;
        this.vocoderOrt = vocoderOrt;
        this.voiceStyles = voiceStyles;
        this.sampleRate = cfg.ae.sample_rate;
    }

    private sampleNoisyLatent(duration: number[]): { noisyLatent: number[][][]; latentMask: number[][][] } {
        const wavLenMax = Math.max(...duration) * this.sampleRate;
        const wavLengths = duration.map(d => Math.floor(d * this.sampleRate));
        const chunkSize = this.cfg.ae.base_chunk_size * this.cfg.ttl.chunk_compress_factor;
        const latentLen = Math.floor((wavLenMax + chunkSize - 1) / chunkSize);
        const latentDim = this.cfg.ttl.latent_dim * this.cfg.ttl.chunk_compress_factor;

        const noisyLatent: number[][][] = [];
        for (let b = 0; b < duration.length; b++) {
            const batch: number[][] = [];
            for (let d = 0; d < latentDim; d++) {
                const row: number[] = [];
                for (let t = 0; t < latentLen; t++) {
                    const eps = 1e-10;
                    const u1 = Math.max(eps, Math.random());
                    const u2 = Math.random();
                    row.push(Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2));
                }
                batch.push(row);
            }
            noisyLatent.push(batch);
        }

        const latentMask = getLatentMask(wavLengths, this.cfg.ae.base_chunk_size, this.cfg.ttl.chunk_compress_factor);

        for (let b = 0; b < noisyLatent.length; b++) {
            for (let d = 0; d < noisyLatent[b].length; d++) {
                for (let t = 0; t < noisyLatent[b][d].length; t++) {
                    noisyLatent[b][d][t] *= latentMask[b][0][t];
                }
            }
        }

        return { noisyLatent, latentMask };
    }

    private async _infer(
        textList: string[],
        langList: string[],
        style: StyleTensors,
        totalStep: number,
        speed: number,
    ): Promise<{ wav: number[]; duration: number[] }> {
        const bsz = textList.length;
        const { textIds, textMask } = this.textProcessor.call(textList, langList);
        const textIdsShape = [bsz, textIds[0].length];
        const textMaskShape = [bsz, 1, textMask[0][0].length];

        const textMaskTensor = arrayToTensor(textMask, textMaskShape);

        const dpResult = await this.dpOrt.run({
            text_ids: intArrayToTensor(textIds, textIdsShape),
            style_dp: style.dp,
            text_mask: textMaskTensor,
        });

        const durOnnx = Array.from(dpResult['duration'].data as Float32Array);
        for (let i = 0; i < durOnnx.length; i++) durOnnx[i] /= speed;

        const textEncResult = await this.textEncOrt.run({
            text_ids: intArrayToTensor(textIds, textIdsShape),
            style_ttl: style.ttl,
            text_mask: textMaskTensor,
        });

        const textEmbTensor = textEncResult['text_emb'];

        const { noisyLatent, latentMask } = this.sampleNoisyLatent(durOnnx);
        const latentShape = [bsz, noisyLatent[0].length, noisyLatent[0][0].length];
        const latentMaskShape = [bsz, 1, latentMask[0][0].length];
        const latentMaskTensor = arrayToTensor(latentMask, latentMaskShape);

        const scalarShape = [bsz];
        const totalStepTensor = arrayToTensor(new Array(bsz).fill(totalStep), scalarShape);

        for (let step = 0; step < totalStep; step++) {
            const vectorEstResult = await this.vectorEstOrt.run({
                noisy_latent:  arrayToTensor(noisyLatent, latentShape),
                text_emb:      textEmbTensor,
                style_ttl:     style.ttl,
                text_mask:     textMaskTensor,
                latent_mask:   latentMaskTensor,
                total_step:    totalStepTensor,
                current_step:  arrayToTensor(new Array(bsz).fill(step), scalarShape),
            });

            const denoised = Array.from(vectorEstResult['denoised_latent'].data as Float32Array);
            let idx = 0;
            for (let b = 0; b < noisyLatent.length; b++)
                for (let d = 0; d < noisyLatent[b].length; d++)
                    for (let t = 0; t < noisyLatent[b][d].length; t++)
                        noisyLatent[b][d][t] = denoised[idx++];
        }

        const vocoderResult = await this.vocoderOrt.run({
            latent: arrayToTensor(noisyLatent, latentShape),
        });

        return {
            wav: Array.from(vocoderResult['wav_tts'].data as Float32Array),
            duration: durOnnx,
        };
    }

    async generate(
        text: string,
        lang: string,
        voiceStyleId: VoiceStyleId,
        totalStep: number,
        speed: number,
        silenceDuration = 0.3,
    ): Promise<{ samples: Float32Array; sampleRate: number }> {
        const style = this.voiceStyles.get(voiceStyleId);
        if (!style) throw new Error(`Voice style ${voiceStyleId} not found`);

        const maxLen = (lang === 'ko' || lang === 'ja') ? 120 : 300;
        const chunks = chunkText(text, maxLen);
        if (chunks.length === 0) chunks.push(text);

        let wavCat: number[] = [];
        let first = true;

        for (const chunk of chunks) {
            const { wav, duration } = await this._infer([chunk], [lang], style, totalStep, speed);
            if (first) {
                wavCat = wav;
                first = false;
            } else {
                const silenceLen = Math.floor(silenceDuration * this.sampleRate);
                const silence = new Array(silenceLen).fill(0);
                wavCat = [...wavCat, ...silence, ...wav];
            }
            // suppress unused warning
            void duration;
        }

        return { samples: Float32Array.from(wavCat), sampleRate: this.sampleRate };
    }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

function findOnnxFile(modelDir: string, prefix: string): string {
    const files = fs.readdirSync(modelDir);
    const found = files.find(f => f.startsWith(prefix) && f.endsWith('.onnx'));
    if (!found) throw new Error(`Supertonic: no ${prefix}*.onnx found in ${modelDir}`);
    return path.join(modelDir, found);
}

export async function loadSupertonicTTS(modelDir: string): Promise<SupertonicTTSEngine> {
    console.log('[Supertonic] loading native engine from', modelDir);

    const cfgPath = path.join(modelDir, 'tts.json');
    if (!fs.existsSync(cfgPath)) {
        throw new Error(`Supertonic: tts.json not found in ${modelDir}. Has the model been downloaded?`);
    }
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as TtsConfig;

    const unicodeIndexerPath = path.join(modelDir, 'unicode_indexer.json');
    if (!fs.existsSync(unicodeIndexerPath)) {
        throw new Error(
            `Supertonic: unicode_indexer.json not found in ${modelDir}. ` +
            `Please re-download the model to fetch supplementary assets.`
        );
    }
    const textProcessor = new UnicodeProcessor(unicodeIndexerPath);

    const sessionOpts: ort.InferenceSession.SessionOptions = { executionProviders: ['cpu'] };

    console.log('[Supertonic] loading ONNX sessions (parallel)...');
    const [dpOrt, textEncOrt, vectorEstOrt, vocoderOrt] = await Promise.all([
        ort.InferenceSession.create(findOnnxFile(modelDir, 'duration_predictor'), sessionOpts),
        ort.InferenceSession.create(findOnnxFile(modelDir, 'text_encoder'),       sessionOpts),
        ort.InferenceSession.create(findOnnxFile(modelDir, 'vector_estimator'),   sessionOpts),
        ort.InferenceSession.create(findOnnxFile(modelDir, 'vocoder'),            sessionOpts),
    ]);
    console.log('[Supertonic] ONNX sessions loaded');

    // Load all voice style JSON files eagerly
    const { SUPERTONIC_VOICES } = await import('./supertonicVoices.js');
    const voiceStyles = new Map<string, StyleTensors>();
    for (const v of SUPERTONIC_VOICES) {
        const stylePath = path.join(modelDir, `${v.id}.json`);
        if (!fs.existsSync(stylePath)) {
            throw new Error(
                `Supertonic: voice style ${v.id}.json not found in ${modelDir}. ` +
                `Please re-download the model to fetch supplementary assets.`
            );
        }
        voiceStyles.set(v.id, loadVoiceStyleJson(stylePath));
    }
    console.log(`[Supertonic] loaded ${voiceStyles.size} voice styles`);

    return new SupertonicTTSEngine(cfg, textProcessor, dpOrt, textEncOrt, vectorEstOrt, vocoderOrt, voiceStyles);
}
