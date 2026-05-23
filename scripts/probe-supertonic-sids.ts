/**
 * Probe the Supertonic 3 model: does varying `sid` at generation time yield
 * different voices from the single bundled voice.bin?
 *
 * Output: /tmp/supertonic-probe/supertonic-sid-{NN}.wav for sid 0..9
 *
 * Run:
 *   LD_LIBRARY_PATH=$PWD/node_modules/sherpa-onnx-linux-x64 bun scripts/probe-supertonic-sids.ts
 */
import * as sherpa_onnx from 'sherpa-onnx-node';
import fs from 'fs';
import path from 'path';

const MODEL_DIR = 'data/models/supertonic-3-sv-int8';
const OUT_DIR = '/tmp/supertonic-probe';
const TEXT = 'Hej, det här är en svensk röst genererad av Supertonic 3.';
const N_SIDS = 10;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

console.log('Initializing Supertonic TTS...');
const tts = new sherpa_onnx.OfflineTts({
    model: {
        supertonic: {
            durationPredictor: path.resolve(`${MODEL_DIR}/duration_predictor.int8.onnx`),
            textEncoder: path.resolve(`${MODEL_DIR}/text_encoder.int8.onnx`),
            vectorEstimator: path.resolve(`${MODEL_DIR}/vector_estimator.int8.onnx`),
            vocoder: path.resolve(`${MODEL_DIR}/vocoder.int8.onnx`),
            ttsJson: path.resolve(`${MODEL_DIR}/tts.json`),
            unicodeIndexer: path.resolve(`${MODEL_DIR}/unicode_indexer.bin`),
            voiceStyle: path.resolve(`${MODEL_DIR}/voice.bin`),
        },
        debug: false,
        numThreads: 4,
        provider: 'cpu',
    },
    maxNumSentences: 0,
});

console.log('Generating', N_SIDS, 'samples with different sids...\n');

for (let sid = 0; sid < N_SIDS; sid++) {
    const t0 = Date.now();
    const generationConfig = new sherpa_onnx.GenerationConfig({
        sid,
        speed: 1,
        extra: { lang: 'sv' },
    });
    try {
        const audio = tts.generate({ text: TEXT, generationConfig });
        const out = path.join(OUT_DIR, `supertonic-sid-${String(sid).padStart(2, '0')}.wav`);
        sherpa_onnx.writeWave(out, { samples: audio.samples, sampleRate: audio.sampleRate });
        console.log(`sid=${sid}  ${audio.samples.length} samples  ${(audio.samples.length / audio.sampleRate).toFixed(2)}s  ${Date.now() - t0}ms  -> ${out}`);
    } catch (e) {
        console.log(`sid=${sid}  ERR: ${(e as Error).message.slice(0, 120)}`);
    }
}

console.log('\nListen and tell me which sids are distinct/usable voices.');
console.log(`Folder:  xdg-open ${OUT_DIR}`);
