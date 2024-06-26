import * as  sherpa_onnx from 'sherpa-onnx-node';
import fs from 'fs'
import { join, resolve } from 'path';
import { downloadModel } from './downloadModel.js';
import objectHash from 'object-hash'
import { env } from '../env';


export async function generateSentence(modelName: string, text: string, lengthScale?: number) {
    console.log(`Generating sentence for model ${modelName} with text: ${text}`);
    const baseDir = join(env.MODELS_DIR, modelName);
    console.log(`Model directory: ${baseDir}`);

    if (!fs.existsSync(baseDir)) {
        console.log(`Model directory ${baseDir} does not exist`);
        await downloadModel(modelName);
    }
    if (!fs.existsSync(baseDir)) {
        console.log({ baseDir });

        throw new Error("RIDI!")
    }
    const files = fs.readdirSync(baseDir)

    // log
    console.log(`Files in model directory: ${files} `);

    const onnxFile = files.find(it => it.endsWith('.onnx'));
    if (!onnxFile) {
        throw new Error('model file does not exists')
    }

    const onnxPath = join(baseDir, onnxFile);

    const tokensPath = files.find(it => it === 'tokens.txt') ? join(baseDir, 'tokens.txt') : undefined;
    const dataPath = files.find(it => it === 'espeak-ng-data') ? join(baseDir, 'espeak-ng-data') : undefined;
    const dictDir = files.find(it => it === 'dict') ? join(baseDir, 'dict') : undefined;

    const hash = objectHash({ modelName, text, lengthScale });
    const filename = hash + '.wav';
    const filePath = join(env.AUDIO_DIR, filename);

    if (fs.existsSync(filePath)) {
        return filePath;
    }

    if (!fs.existsSync(env.AUDIO_DIR)) {
        fs.mkdirSync(env.AUDIO_DIR)
    }

    console.log({ baseDir, files, onnxFile, onnxPath, tokensPath, dataPath });
    console.log({ modelName, text });

    function createOfflineTts() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vits: any = { model: resolve(onnxPath) };
        vits.tokens = tokensPath ? resolve(tokensPath) : undefined;
        if (dataPath) vits.dataDir = dataPath;
        if (dictDir) vits.dictDir = dataPath;

        return new sherpa_onnx.OfflineTts({
            model: {
                vits: vits,
                debug: true,
                numThreads: env.THREAD_COUNT ?? 1,
                provider: 'cpu',
            },
            maxNumSentences: 99999999,
            ruleFsts: '', // could be added the same way filter and joing .fst files 
            //  example:  '/path/model-name/date.fst,/path/model-name/phone.fst'
            ruleFars: '', // save way .far files
            debug: true,
            
        });
    }


    const tts = createOfflineTts();
    const speakerId = 0;
    const speed = 1.0;
    const audio = tts.generate({
        text: text,
        sid: speakerId,
        speed: speed
    });

    sherpa_onnx.writeWave(filePath, { samples: audio.samples, sampleRate: audio.sampleRate })

    console.log('Saved to ' + filePath + ' successfully.');

    return filePath;
}