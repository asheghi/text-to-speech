/* eslint-disable @typescript-eslint/no-explicit-any */
import * as sherpa_onnx from 'sherpa-onnx-node';
import fs from 'fs'
import { join, resolve } from 'path';
import { downloadModel } from './downloadModel.js';
import objectHash from 'object-hash'
import { env } from '../env';
import os from 'node:os'
import { findCustomModel } from './customModels';
import { loadSupertonicTTS } from './supertonicEngine.js';
import {
    DEFAULT_VOICE_STYLE,
    DEFAULT_STEPS,
    MIN_STEPS,
    MAX_STEPS,
    type VoiceStyleId,
} from './supertonicVoices.js';


const ThreadCount = env.THREAD_COUNT ?? (os.cpus()).length;

type Family = 'vits' | 'supertonic' | 'kitten';

/**
 * Detect which TTS model family lives in a bundle directory.
 * - Supertonic: `tts.json` + `unicode_indexer.json` or `unicode_indexer.bin` at root.
 * - Kitten TTS: `voices.bin` at root.
 * - Everything else: single-onnx VITS (Piper, MMS, Coqui).
 */
function detectFamily(files: string[]): Family {
    // Supertonic: tts.json + unicode_indexer (either .json or .bin)
    if (files.includes('tts.json') && (files.includes('unicode_indexer.json') || files.includes('unicode_indexer.bin'))) {
        return 'supertonic';
    }
    if (files.includes('voices.bin')) {
        return 'kitten';
    }
    return 'vits';
}

function createVitsTTS(baseDir: string, files: string[]): any {
    const onnxFile = files.find(it => it.endsWith('.onnx'));
    if (!onnxFile) {
        throw new Error('VITS model: no .onnx file in ' + baseDir);
    }
    const onnxPath = join(baseDir, onnxFile);
    const tokensPath = files.find(it => it === 'tokens.txt') ? join(baseDir, 'tokens.txt') : undefined;
    const dataPath = files.find(it => it === 'espeak-ng-data') ? join(baseDir, 'espeak-ng-data') : undefined;
    const dictDir = files.find(it => it === 'dict') ? join(baseDir, 'dict') : undefined;

    const vits: any = { model: resolve(onnxPath) };
    if (tokensPath) vits.tokens = resolve(tokensPath);
    if (dataPath) vits.dataDir = dataPath;
    if (dictDir) vits.dictDir = dictDir;

    return new sherpa_onnx.OfflineTts({
        model: {
            vits,
            debug: true,
            numThreads: ThreadCount,
            provider: 'cpu',
        },
        maxNumSentences: 0,
        ruleFsts: '',
        ruleFars: '',
        debug: true,
    });
}

function createKittenTTS(baseDir: string, files: string[]): any {
    const onnxFile = files.find(it => it.endsWith('.onnx'));
    if (!onnxFile) {
        throw new Error('Kitten model: no .onnx file in ' + baseDir);
    }
    if (!files.includes('voices.bin')) {
        throw new Error('Kitten model: missing voices.bin in ' + baseDir);
    }
    const tokensPath = files.includes('tokens.txt') ? resolve(join(baseDir, 'tokens.txt')) : undefined;
    const dataPath = files.includes('espeak-ng-data') ? resolve(join(baseDir, 'espeak-ng-data')) : undefined;
    if (!dataPath) {
        throw new Error(
            `Kitten model: missing espeak-ng-data in ${baseDir}. ` +
            `Cannot load model — sherpa-onnx would call exit() without it.`
        );
    }

    const kitten: any = {
        model: resolve(join(baseDir, onnxFile)),
        voices: resolve(join(baseDir, 'voices.bin')),
    };
    if (tokensPath) kitten.tokens = tokensPath;
    kitten.dataDir = dataPath;

    return new sherpa_onnx.OfflineTts({
        model: {
            kitten,
            debug: true,
            numThreads: ThreadCount,
            provider: 'cpu',
        },
        maxNumSentences: 0,
        ruleFsts: '',
        ruleFars: '',
        debug: true,
    });
}

type TtsEntry =
    | { family: 'vits' | 'kitten'; tts: any }
    | { family: 'supertonic'; tts: Awaited<ReturnType<typeof loadSupertonicTTS>> };

async function createTTS(modelName?: string): Promise<TtsEntry> {
    if (!modelName) {
        throw new Error('create TTS is called without model name');
    }
    const baseDir = join(env.MODELS_DIR, modelName);

    // Always run downloadModel — it is idempotent. For models whose directory
    // already exists it skips the archive download but still fetches any
    // missing extraFiles (e.g. the Supertonic supplementary assets added after
    // the model was first installed).
    await downloadModel(modelName);
    if (!fs.existsSync(baseDir)) {
        throw new Error(`Model ${modelName} could not be prepared at ${baseDir}`);
    }

    if (!fs.existsSync(env.AUDIO_DIR)) {
        fs.mkdirSync(env.AUDIO_DIR);
    }

    const files = fs.readdirSync(baseDir);
    const family = detectFamily(files);
    console.log(`[TTS] family for ${modelName}: ${family}`);

    if (family === 'supertonic') {
        const tts = await loadSupertonicTTS(baseDir);
        return { family, tts };
    }

    const tts = family === 'kitten'
        ? createKittenTTS(baseDir, files)
        : createVitsTTS(baseDir, files);

    return { family, tts };
}


const cache: { [key: string]: TtsEntry } = {};

/**
 * Resolve a model name to the actual directory + cache key. Alias entries
 * point at a source model whose files they share; we want one TTS instance
 * in memory regardless of how many aliases the picker exposes.
 */
function resolveSourceModelName(modelName: string): string {
    return findCustomModel(modelName)?.aliasOf ?? modelName;
}

async function getTTS(modelName: string) {
    const sourceModelName = resolveSourceModelName(modelName);
    let entry = cache[sourceModelName];
    if (!entry) {
        entry = await createTTS(sourceModelName);
        cache[sourceModelName] = entry;
    }
    return entry;
}


export async function generateSentence(
    modelName: string,
    text: string,
    speed: number,
    steps: number = DEFAULT_STEPS,
    voiceStyle: VoiceStyleId = DEFAULT_VOICE_STYLE,
): Promise<string> {
    console.log("[TTS] generate sentence", { text, modelName, steps, voiceStyle });

    const custom = findCustomModel(modelName);
    // Language code for Supertonic. For VITS it's in the cache key but has no
    // effect on generation. Default 'sv' to preserve existing audio cache.
    const lang = custom?.defaultLang ?? 'sv';

    // Clamp steps to valid range
    const clampedSteps = Math.max(MIN_STEPS, Math.min(MAX_STEPS, Math.round(steps)));

    // Include all generation params in the cache key so different settings
    // never collide. (sid is removed — replaced by voiceStyle for Supertonic;
    // VITS has no voice selection, so voiceStyle is harmless in the key.)
    const hash = objectHash({ modelName, text, speed, lang, steps: clampedSteps, voiceStyle });
    const filename = hash + '.wav';
    const filePath = join(env.AUDIO_DIR, filename);

    if (fs.existsSync(filePath)) {
        console.log('[TTS] reading from cache');
        return filePath;
    }

    const entry = await getTTS(modelName);

    await generateSpeech(entry, text, filePath, speed, clampedSteps, voiceStyle, lang);

    return filePath;
}

async function generateSpeech(
    entry: TtsEntry,
    text: string,
    filePath: string,
    speed: number,
    steps: number,
    voiceStyle: VoiceStyleId,
    lang: string,
): Promise<void> {
    const before = Date.now();
    console.log('[TTS] generate speech', { family: entry.family, speed, steps, voiceStyle, lang }, text.substring(0, 50));

    if (entry.family === 'supertonic') {
        const { samples, sampleRate } = await entry.tts.generate(text, lang, voiceStyle, steps, speed);
        writePcmWav(filePath, samples, sampleRate);
    } else {
        // VITS and Kitten both use the flat sherpa-onnx generate form.
        // voiceStyle is Supertonic-only; VITS always uses sid=0 because each
        // picker entry is already a distinct model (no multi-voice aliases).
        const audio = entry.tts.generate({
            text,
            sid: 0,
            speed,
            enableExternalBuffer: true,
        });
        sherpa_onnx.writeWave(filePath, { samples: audio.samples, sampleRate: audio.sampleRate });
    }

    const after = Date.now();
    console.log('[TTS] finished', { filePath, duration: after - before });
}

/**
 * Write a 16-bit mono PCM WAV file from a Float32Array of normalised samples.
 * Used by the native Supertonic path (sherpa-onnx's writeWave is not called).
 */
function writePcmWav(filePath: string, samples: Float32Array, sampleRate: number): void {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = samples.length * (bitsPerSample / 8);

    const buffer = Buffer.alloc(44 + dataSize);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);          // PCM
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
    }

    fs.writeFileSync(filePath, buffer);
}

// Re-export constants so callers (server/index.ts etc.) can import from one place.
export { DEFAULT_STEPS, MIN_STEPS, MAX_STEPS, DEFAULT_VOICE_STYLE, type VoiceStyleId };
