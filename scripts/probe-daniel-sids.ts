/**
 * One-off probe: generate one short WAV per sid 0..15 for the daniel multi-
 * speaker model so the user can listen and identify which sid is the cloned
 * "Daniel" voice. The release ships zero documentation on which sid is which.
 *
 * Output: /tmp/daniel-probe/daniel-sid-{NN}.wav
 *
 * Run:
 *   LD_LIBRARY_PATH=$PWD/node_modules/sherpa-onnx-linux-x64 bun scripts/probe-daniel-sids.ts
 */
import * as sherpa_onnx from 'sherpa-onnx-node';
import fs from 'fs';
import path from 'path';

const MODEL_DIR = 'data/models/vits-piper-sv_SE-daniel-medium';
const OUT_DIR = '/tmp/daniel-probe';
const TEXT = 'Hej, jag heter Daniel och jag kommer från Sverige. Idag pratar vi om vädret.';
const N_SPEAKERS = 16; // confirmed by binary-search probe earlier

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(MODEL_DIR);
const onnx = files.find((f) => f.endsWith('.onnx'));
if (!onnx) throw new Error(`no .onnx in ${MODEL_DIR}`);

console.log('Initializing TTS...');
const tts = new sherpa_onnx.OfflineTts({
    model: {
        vits: {
            model: path.join(MODEL_DIR, onnx),
            tokens: path.join(MODEL_DIR, 'tokens.txt'),
            dataDir: path.join(MODEL_DIR, 'espeak-ng-data'),
        },
        debug: false,
        numThreads: 4,
        provider: 'cpu',
    },
    maxNumSentences: 0,
});
console.log('TTS sample rate:', tts.sampleRate, 'metadata numSpeakers:', tts.numSpeakers);
console.log('Generating', N_SPEAKERS, 'samples...\n');

for (let sid = 0; sid < N_SPEAKERS; sid++) {
    const t0 = Date.now();
    const audio = tts.generate({ text: TEXT, sid, speed: 1, enableExternalBuffer: true });
    const out = path.join(OUT_DIR, `daniel-sid-${String(sid).padStart(2, '0')}.wav`);
    sherpa_onnx.writeWave(out, { samples: audio.samples, sampleRate: audio.sampleRate });
    console.log(`sid=${sid}  ${audio.samples.length} samples  ${((audio.samples.length / audio.sampleRate)).toFixed(2)}s  ${Date.now() - t0}ms  -> ${out}`);
}

console.log('\nDone. Listen and tell me which sid is the real Daniel voice.');
console.log(`Quick play (one at a time):  ffplay -nodisp -autoexit ${OUT_DIR}/daniel-sid-00.wav`);
console.log(`Or open the folder:          xdg-open ${OUT_DIR}`);
