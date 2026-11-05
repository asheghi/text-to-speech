import { spawn } from 'child_process';
import fs from 'fs';

/**
 * Transport encodings for the generated WAV. The WAV stays the canonical
 * cached file; an encoded copy sits next to it (same hash, other extension) so
 * repeat requests skip ffmpeg. The cleanup job ages both out together.
 *
 * FLAC is lossless: decoding it gives back exactly the WAV's PCM samples.
 * Opus is lossy and only for callers that do not need the exact samples.
 */
export const AUDIO_FORMATS = ['wav', 'flac', 'opus'] as const;
export type AudioFormat = (typeof AUDIO_FORMATS)[number];

export const CONTENT_TYPES: Record<AudioFormat, string> = {
    wav: 'audio/wave',
    flac: 'audio/flac',
    opus: 'audio/ogg',
};

export const EXTENSIONS: Record<AudioFormat, string> = {
    wav: 'wav',
    flac: 'flac',
    opus: 'ogg',
};

export function parseAudioFormat(value: unknown): AudioFormat | null {
    if (value === undefined || value === '') return 'wav';
    if (typeof value !== 'string') return null;
    const lower = value.toLowerCase();
    return (AUDIO_FORMATS as readonly string[]).includes(lower) ? (lower as AudioFormat) : null;
}

const FFMPEG_ARGS: Record<Exclude<AudioFormat, 'wav'>, string[]> = {
    // bitexact + no metadata keeps the output deterministic for the same input.
    flac: ['-c:a', 'flac', '-compression_level', '8', '-f', 'flac'],
    opus: ['-c:a', 'libopus', '-b:a', '32k', '-application', 'voip', '-f', 'ogg'],
};

function runFfmpeg(inputPath: string, format: Exclude<AudioFormat, 'wav'>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const proc = spawn('ffmpeg', [
            '-hide_banner', '-loglevel', 'error', '-nostdin',
            '-i', inputPath,
            '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact',
            ...FFMPEG_ARGS[format],
            'pipe:1',
        ]);
        const chunks: Buffer[] = [];
        let stderr = '';
        proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
        proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
        proc.on('error', reject);
        proc.on('close', (code) => {
            if (code === 0) resolve(Buffer.concat(chunks));
            else reject(new Error(`ffmpeg ${format} exited ${code}: ${stderr.slice(0, 300)}`));
        });
    });
}

/**
 * Returns the path of `wavPath` encoded as `format`, creating it on first use.
 * Under NO_AUDIO_CACHE the caller removes it after sending, same as the WAV.
 */
export async function encodedPath(wavPath: string, format: AudioFormat): Promise<string> {
    if (format === 'wav') return wavPath;
    const target = wavPath.replace(/\.wav$/, `.${EXTENSIONS[format]}`);
    if (fs.existsSync(target)) return target;
    const bytes = await runFfmpeg(wavPath, format);
    // Write via a temp name so a concurrent reader never sees a half file.
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fs.promises.writeFile(tmp, bytes);
    await fs.promises.rename(tmp, target);
    return target;
}
