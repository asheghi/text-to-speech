/* eslint-disable @typescript-eslint/no-explicit-any */
import * as  sherpa_onnx from 'sherpa-onnx-node';
import fs from 'fs'
import { join, resolve } from 'path';
import { downloadModel } from './downloadModel.js';
import objectHash from 'object-hash'
import { env } from '../env';


async function createTTS(modelName?: string) {
    // console.log(`Generating sentence for model ${modelName} with text: ${text}`);
    const baseDir = join(env.MODELS_DIR, modelName);
    // console.log(`Model directory: ${baseDir}`);

    if (!fs.existsSync(baseDir)) {
        console.log(`Model directory ${baseDir} does not exist`);
        await downloadModel(modelName);
    }
    if (!fs.existsSync(baseDir)) {
        console.log({ baseDir });

        throw new Error("RIDI!")
    }

    const files = fs.readdirSync(baseDir)

    const onnxFile = files.find(it => it.endsWith('.onnx'));
    if (!onnxFile) {
        throw new Error('model file does not exists')
    }

    const onnxPath = join(baseDir, onnxFile);

    const tokensPath = files.find(it => it === 'tokens.txt') ? join(baseDir, 'tokens.txt') : undefined;
    const dataPath = files.find(it => it === 'espeak-ng-data') ? join(baseDir, 'espeak-ng-data') : undefined;
    const dictDir = files.find(it => it === 'dict') ? join(baseDir, 'dict') : undefined;

    if (!fs.existsSync(env.AUDIO_DIR)) {
        fs.mkdirSync(env.AUDIO_DIR)
    }


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vits: any = { model: resolve(onnxPath) };
    vits.tokens = tokensPath ? resolve(tokensPath) : undefined;
    if (dataPath) vits.dataDir = dataPath;
    if (dictDir) vits.dictDir = dataPath;

    const tts = new sherpa_onnx.OfflineTts({
        model: {
            vits: vits,
            debug: true,
            numThreads: env.THREAD_COUNT ?? 1,
            provider: 'cpu',

        },
        maxNumSentences: 1,
        ruleFsts: '', // could be added the same way filter and joing .fst files 
        //  example:  '/path/model-name/date.fst,/path/model-name/phone.fst'
        ruleFars: '', // save way .far files
        debug: true,
        noiseScale: 10,
        noiseScaleW: 10,
        lengthScale: 1.5,
    });

    return tts;
}


const cache: { [key: string]: any } = {};

async function getTTS(modelName: string) {
    let tts = cache[modelName];
    if (!tts) {
        tts = await createTTS(modelName);
        cache[modelName] = tts;
    }
    return tts;
}


export async function generateSentence(modelName: string, text: string, lengthScale?: number) {
    console.log("[TTS] generate sentence",{text,modelName});
    const hash = objectHash({ modelName, text, lengthScale });
    const filename = hash + '.wav';
    const filePath = join(env.AUDIO_DIR, filename);

    if (fs.existsSync(filePath)) {
        console.log('[TTS] reading from cache');
        return filePath;
    }

    const tts = await getTTS(modelName);

    generateSpeech(tts, text, filePath);

    return filePath;
}

function generateSpeech(tts: any, text: string, filePath: string) {
    const before = Date.now();
    console.log('[TTS] generate speech');
    const speakerId = 0;
    const speed = 0.75;
    const audio = tts.generate({
        text: text,
        sid: speakerId,
        speed: speed,
        enableExternalBuffer: true,
    });

    sherpa_onnx.writeWave(filePath, { samples: audio.samples, sampleRate: audio.sampleRate });
    const after = Date.now();
    console.log('[TTS] finished', { filePath, duration: after - before });
}
