// Synthesise sentences with the Supertonic engine directly (no server), for
// model-variant comparisons. Text goes through the same Swedish pipeline.
//   bun tools/sv-loop/synth.ts <model-dir> <out-dir> <sentences.txt> <voices> <steps>
import fs from 'fs';
import { loadSupertonicTTS } from '../../server/lib/supertonicEngine';
import { normalizeSwedish } from '../../server/lib/normalizeSwedish';
import { respellSwedishForSupertonic } from '../../server/lib/swedishRespell';
import type { VoiceStyleId } from '../../server/lib/supertonicVoices';

const [dir, out, file, voices = 'F1', steps = '8'] = process.argv.slice(2);
const sentences = fs.readFileSync(file, 'utf8').split('\n').filter(s => s.trim());
function wav(path: string, s: Float32Array, sr: number) {
    const b = Buffer.alloc(44 + s.length * 2);
    b.write('RIFF', 0); b.writeUInt32LE(36 + s.length * 2, 4); b.write('WAVEfmt ', 8);
    b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24);
    b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36);
    b.writeUInt32LE(s.length * 2, 40);
    s.forEach((v, i) => b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), 44 + i * 2));
    fs.writeFileSync(path, b);
}
const engine = await loadSupertonicTTS(dir);
fs.mkdirSync(out, { recursive: true });
let ms = 0;
for (const v of voices.split(',')) for (const [i, s] of sentences.entries()) {
    const text = respellSwedishForSupertonic(normalizeSwedish(s));
    const t0 = performance.now();
    const { samples, sampleRate } = await engine.generate(text, 'sv', v as VoiceStyleId, +steps, 1);
    ms += performance.now() - t0;
    wav(`${out}/${v}-${String(i + 1).padStart(3, '0')}.wav`, samples, sampleRate);
}
console.log(`ms/sentence ${(ms / (sentences.length * voices.split(',').length)).toFixed(0)}`);
