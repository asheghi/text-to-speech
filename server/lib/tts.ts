/* eslint-disable @typescript-eslint/no-explicit-any */
import * as  sherpa_onnx from 'sherpa-onnx-node';
import fs from 'fs'
import { join, resolve } from 'path';
import { downloadModel } from './downloadModel.js';
import objectHash from 'object-hash'
import { env } from '../env';
import os from 'node:os'
import { findCustomModel } from './customModels';


const ThreadCount = env.THREAD_COUNT ?? (os.cpus()).length;

type Family = 'vits' | 'supertonic';

/**
 * Detect which TTS model family lives in a bundle directory. Supertonic is
 * uniquely identifiable by `tts.json` + `unicode_indexer.bin` at the root;
 * everything else we currently support is single-onnx VITS (Piper, MMS, Coqui).
 */
function detectFamily(files: string[]): Family {
    if (files.includes('tts.json') && files.includes('unicode_indexer.bin')) {
        return 'supertonic';
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

function createSupertonicTTS(baseDir: string, files: string[]): any {
    const findOnnx = (prefix: string): string => {
        const f = files.find(it => it.startsWith(prefix) && it.endsWith('.onnx'));
        if (!f) throw new Error(`Supertonic: missing ${prefix}*.onnx in ${baseDir}`);
        return resolve(join(baseDir, f));
    };
    const requireFile = (name: string): string => {
        if (!files.includes(name)) {
            throw new Error(`Supertonic: missing ${name} in ${baseDir}`);
        }
        return resolve(join(baseDir, name));
    };

    return new sherpa_onnx.OfflineTts({
        model: {
            supertonic: {
                durationPredictor: findOnnx('duration_predictor'),
                textEncoder: findOnnx('text_encoder'),
                vectorEstimator: findOnnx('vector_estimator'),
                vocoder: findOnnx('vocoder'),
                ttsJson: requireFile('tts.json'),
                unicodeIndexer: requireFile('unicode_indexer.bin'),
                voiceStyle: requireFile('voice.bin'),
            },
            debug: true,
            numThreads: ThreadCount,
            provider: 'cpu',
        },
        maxNumSentences: 0,
    });
}

async function createTTS(modelName?: string): Promise<{ tts: any; family: Family }> {
    if (!modelName) {
        throw new Error('create TTS is called without model name');
    }
    const baseDir = join(env.MODELS_DIR, modelName);

    if (!fs.existsSync(baseDir)) {
        console.log(`Model directory ${baseDir} does not exist`);
        await downloadModel(modelName);
    }
    if (!fs.existsSync(baseDir)) {
        throw new Error(`Model ${modelName} could not be prepared at ${baseDir}`);
    }

    if (!fs.existsSync(env.AUDIO_DIR)) {
        fs.mkdirSync(env.AUDIO_DIR);
    }

    const files = fs.readdirSync(baseDir);
    const family = detectFamily(files);
    console.log(`[TTS] family for ${modelName}: ${family}`);

    const tts = family === 'supertonic'
        ? createSupertonicTTS(baseDir, files)
        : createVitsTTS(baseDir, files);

    return { tts, family };
}


const cache: { [key: string]: { tts: any; family: Family } } = {};

/**
 * Resolve a model name to the actual directory + cache key. Alias entries
 * (e.g. Supertonic voice variants) point at a source model whose files they
 * share; we want one OfflineTts instance in memory regardless of how many
 * voice aliases the picker exposes.
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


export async function generateSentence(modelName: string, text: string, speed: number) {
    console.log("[TTS] generate sentence", { text, modelName });
    const custom = findCustomModel(modelName);
    // Per-model pinned speaker id (for multi-speaker bundles where we want to
    // expose just one voice). Falls back to 0 — the original behavior.
    const sid = custom?.defaultSid ?? 0;
    // Language code passed as Supertonic's `extra.lang`. For VITS it has no
    // effect on generation but is still in the cache key. Default 'sv' to
    // preserve existing cache entries created when the language was hardcoded.
    const lang = custom?.defaultLang ?? 'sv';
    // Include sid + lang in the cache key so different speakers/languages
    // don't collide.
    const hash = objectHash({ modelName, text, speed, sid, lang });
    const filename = hash + '.wav';
    const filePath = join(env.AUDIO_DIR, filename);

    if (fs.existsSync(filePath)) {
        console.log('[TTS] reading from cache');
        return filePath;
    }

    const { tts, family } = await getTTS(modelName);

    generateSpeech(tts, family, text, filePath, speed, sid, lang);

    return filePath;
}

function generateSpeech(
    tts: any,
    family: Family,
    text: string,
    filePath: string,
    speed: number,
    speakerId: number,
    lang: string,
) {
    const before = Date.now();
    console.log('[TTS] generate speech', { family, speed, speakerId, lang }, text.substring(0, 50));

    let audio;
    if (family === 'supertonic') {
        // Supertonic requires the GenerationConfig form (extra.lang is its
        // language selector at inference time).
        const generationConfig = new sherpa_onnx.GenerationConfig({
            sid: speakerId,
            speed,
            extra: { lang },
        });
        audio = tts.generate({ text, generationConfig });
    } else {
        // VITS keeps the flat form (preserves existing behavior bit-for-bit).
        audio = tts.generate({
            text,
            sid: speakerId,
            speed,
            enableExternalBuffer: true,
        });
    }

    sherpa_onnx.writeWave(filePath, { samples: audio.samples, sampleRate: audio.sampleRate });
    const after = Date.now();
    console.log('[TTS] finished', { filePath, duration: after - before });
}
