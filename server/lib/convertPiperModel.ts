import fs from 'fs';
import path from 'path';
import { env } from '../env';
import { $ } from 'bun';

export type PiperFallback = {
    sampleRate: number;
    language: string;
    voice: string;
    numSpeakers: number;
};

/**
 * Convert a raw Piper voice bundle into a sherpa-onnx-ready directory.
 *
 * The expected bundle is `.onnx` + `.onnx.json`; if `.onnx.json` is missing
 * (some releases ship just the model), pass `fallback` and the converter
 * will use those defaults for metadata + borrow `tokens.txt` from any
 * already-extracted Piper voice. This is safe because Piper voices that
 * share a language share an identical phoneme_id_map.
 *
 * After this runs, the directory will look like a `vits-piper-*` bundle
 * from the k2-fsa release: `.onnx` (with metadata injected), `tokens.txt`,
 * and an `espeak-ng-data/` symlink pointing to a shared copy under
 * `MODELS_DIR/_espeak-ng-data`.
 */
export async function convertPiperRawToSherpa(
    modelDir: string,
    fallback?: PiperFallback,
): Promise<void> {
    const files = fs.readdirSync(modelDir);
    const onnxFile = files.find((f) => f.endsWith('.onnx'));
    const jsonFile = files.find((f) => f.endsWith('.onnx.json'));
    if (!onnxFile) {
        throw new Error(
            `convertPiperRawToSherpa: no .onnx in ${modelDir}, got ${files.join(', ')}`
        );
    }
    if (!jsonFile && !fallback) {
        throw new Error(
            `convertPiperRawToSherpa: ${modelDir} has no .onnx.json and no fallback was provided`
        );
    }

    const onnxPath = path.join(modelDir, onnxFile);
    const piperJson: PiperJson | undefined = jsonFile
        ? JSON.parse(fs.readFileSync(path.join(modelDir, jsonFile), 'utf8'))
        : undefined;

    // 1. tokens.txt
    const tokensPath = path.join(modelDir, 'tokens.txt');
    if (!fs.existsSync(tokensPath)) {
        if (piperJson?.phoneme_id_map) {
            writeTokensFromPiperJson(piperJson, tokensPath);
            console.log(`[convertPiperRawToSherpa] wrote ${tokensPath}`);
        } else {
            const borrowed = findSiblingTokensTxt(modelDir);
            if (!borrowed) {
                throw new Error(
                    `convertPiperRawToSherpa: ${modelDir} has no phoneme_id_map and no sibling Piper voice to borrow tokens.txt from`
                );
            }
            fs.copyFileSync(borrowed, tokensPath);
            console.log(`[convertPiperRawToSherpa] borrowed tokens.txt from ${borrowed}`);
        }
    }

    // 2. ONNX metadata injection (idempotent: skip if already injected).
    if (!onnxHasSherpaMetadata(onnxPath)) {
        const sampleRate = piperJson?.audio?.sample_rate ?? fallback?.sampleRate ?? 22050;
        const language = piperJson?.language?.name_english ?? fallback?.language ?? 'Unknown';
        const voice = piperJson?.espeak?.voice ?? fallback?.voice ?? '';
        const numSpeakers = piperJson?.num_speakers ?? fallback?.numSpeakers ?? 1;
        injectOnnxMetadata(onnxPath, {
            model_type: 'vits',
            comment: 'piper',
            language: String(language),
            voice: String(voice),
            version: '1',
            has_espeak: '1',
            has_g2pw: '0',
            n_speakers: String(numSpeakers),
            sample_rate: String(sampleRate),
        });
        console.log(`[convertPiperRawToSherpa] injected metadata into ${onnxPath}`);
    }

    // 3. espeak-ng-data: symlink to a shared copy under MODELS_DIR.
    const espeakLink = path.join(modelDir, 'espeak-ng-data');
    if (!fs.existsSync(espeakLink)) {
        const sharedEspeak = await ensureSharedEspeakData();
        const rel = path.relative(modelDir, sharedEspeak);
        fs.symlinkSync(rel, espeakLink);
        console.log(`[convertPiperRawToSherpa] linked ${espeakLink} -> ${rel}`);
    }
}

type PiperJson = {
    audio?: { sample_rate?: number };
    language?: { name_english?: string };
    espeak?: { voice?: string };
    num_speakers?: number;
    phoneme_id_map?: Record<string, number[]>;
};

/**
 * Look for an existing Piper-voice directory under MODELS_DIR with a tokens.txt
 * we can copy. Returns the absolute path, or undefined if none found.
 * Skips the directory the caller is currently converting.
 */
function findSiblingTokensTxt(skipDir: string): string | undefined {
    const skipName = path.basename(skipDir);
    const siblings = fs.readdirSync(env.MODELS_DIR, { withFileTypes: true });
    for (const sib of siblings) {
        if (!sib.isDirectory() || sib.name === skipName) continue;
        const candidate = path.join(env.MODELS_DIR, sib.name, 'tokens.txt');
        if (fs.existsSync(candidate)) return candidate;
    }
    return undefined;
}

function writeTokensFromPiperJson(piperJson: PiperJson, outPath: string): void {
    const map = piperJson?.phoneme_id_map;
    if (!map || typeof map !== 'object') {
        throw new Error('Piper JSON has no phoneme_id_map');
    }
    // Format used by sherpa-onnx: "<token> <id>" per line, sorted by id.
    const rows: Array<[string, number]> = [];
    for (const [token, ids] of Object.entries(map)) {
        if (!Array.isArray(ids) || ids.length === 0) continue;
        rows.push([token, ids[0] as number]);
    }
    rows.sort((a, b) => a[1] - b[1]);
    const body = rows.map(([t, id]) => `${t} ${id}`).join('\n') + '\n';
    fs.writeFileSync(outPath, body, 'utf8');
}

/**
 * Append ONNX metadata_props entries by writing raw protobuf at the end of
 * the file. This works because protobuf repeated fields are order-independent
 * and concat-as-merge: appending new entries is equivalent to setting them.
 *
 * NOT idempotent in the strict sense — calling twice will duplicate entries.
 * Callers should check `onnxHasSherpaMetadata` first.
 */
export function injectOnnxMetadata(onnxPath: string, meta: Record<string, string>): void {
    const original = fs.readFileSync(onnxPath);
    const additions = Object.entries(meta).map(([k, v]) => buildMetadataPropsEntry(k, v));
    fs.writeFileSync(onnxPath, Buffer.concat([original, ...additions]));
}

function varint(n: number): number[] {
    const out: number[] = [];
    while (n > 0x7f) {
        out.push((n & 0x7f) | 0x80);
        n >>>= 7;
    }
    out.push(n);
    return out;
}

function buildMetadataPropsEntry(key: string, value: string): Buffer {
    const k = Buffer.from(key, 'utf8');
    const v = Buffer.from(value, 'utf8');
    // StringStringEntryProto: field 1 (key, string), field 2 (value, string)
    const inner = Buffer.concat([
        Buffer.from([10, ...varint(k.length)]), k,
        Buffer.from([18, ...varint(v.length)]), v,
    ]);
    // ModelProto.metadata_props is field 14 (wire type 2 / length-delimited)
    return Buffer.concat([
        Buffer.from([114, ...varint(inner.length)]),
        inner,
    ]);
}

/**
 * Cheap check: scan the file for the literal string "model_type". The Piper
 * raw bundle has no metadata; the injected/converted bundle does. Good enough
 * to make the conversion step idempotent across server restarts.
 */
function onnxHasSherpaMetadata(onnxPath: string): boolean {
    const buf = fs.readFileSync(onnxPath);
    return buf.indexOf('model_type') !== -1;
}

/**
 * Ensure a single `espeak-ng-data` directory exists under MODELS_DIR. Reuses
 * the copy from any already-extracted Piper bundle if available; otherwise
 * downloads the standalone `espeak-ng-data.tar.bz2` from the k2-fsa release.
 */
async function ensureSharedEspeakData(): Promise<string> {
    const sharedDir = path.join(env.MODELS_DIR, '_espeak-ng-data');
    if (fs.existsSync(sharedDir)) return sharedDir;

    // Try to reuse from a sibling Piper voice. Copy (not symlink) so removing
    // the sibling later doesn't break our voices — espeak-ng-data is ~19 MB,
    // small enough to dedupe lazily once instead of downloading.
    const siblings = fs.readdirSync(env.MODELS_DIR, { withFileTypes: true });
    for (const sib of siblings) {
        if (!sib.isDirectory()) continue;
        const candidate = path.join(env.MODELS_DIR, sib.name, 'espeak-ng-data');
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
            console.log(`[convertPiperRawToSherpa] copying espeak-ng-data from ${sib.name}`);
            await $`cp -r ${candidate} ${sharedDir}`;
            return sharedDir;
        }
    }

    // Fall back to downloading the standalone tarball.
    const url = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/espeak-ng-data.tar.bz2';
    const tarPath = path.join(env.MODELS_DIR, 'espeak-ng-data.tar.bz2');
    console.log(`[convertPiperRawToSherpa] downloading ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download espeak-ng-data: ${res.status}`);
    fs.writeFileSync(tarPath, Buffer.from(await res.arrayBuffer()));
    await $`tar -xvf ${tarPath} -C ${env.MODELS_DIR}`;
    fs.unlinkSync(tarPath);
    const extracted = path.join(env.MODELS_DIR, 'espeak-ng-data');
    if (!fs.existsSync(extracted)) {
        throw new Error('espeak-ng-data extraction produced no dir');
    }
    // Rename to the shared name so we don't collide with per-model dirs.
    fs.renameSync(extracted, sharedDir);
    return sharedDir;
}
