import * as fs from 'fs';
import * as path from 'path';
import { env } from '../env';

const DAY_MS = 24 * 60 * 60 * 1000;

const SHARE_MAX_AGE_MS = 30 * DAY_MS;
const AUDIO_MAX_AGE_MS = 7 * DAY_MS;

/**
 * Delete files directly inside `dir` whose mtime is older than `maxAgeMs`.
 * Returns the number of files removed. Missing directories are a no-op.
 */
async function cleanupDir(dir: string, maxAgeMs: number): Promise<number> {
    let removed = 0;

    let entries: string[];
    try {
        entries = await fs.promises.readdir(dir);
    } catch (error) {
        // Directory doesn't exist yet (no shares/audio generated) — nothing to do.
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
        console.error(`[cleanup] failed to read directory ${dir}:`, error);
        return 0;
    }

    const cutoff = Date.now() - maxAgeMs;

    for (const entry of entries) {
        const filePath = path.join(dir, entry);
        try {
            const stat = await fs.promises.stat(filePath);
            if (!stat.isFile()) continue;
            if (stat.mtimeMs < cutoff) {
                await fs.promises.unlink(filePath);
                removed++;
            }
        } catch (error) {
            console.error(`[cleanup] failed to process ${filePath}:`, error);
        }
    }

    return removed;
}

/** Run a single cleanup pass over shares and audio cache. */
export async function runCleanup(): Promise<void> {
    const sharedDir = path.join(process.cwd(), 'data', 'shared');
    const audioDir = path.isAbsolute(env.AUDIO_DIR)
        ? env.AUDIO_DIR
        : path.join(process.cwd(), env.AUDIO_DIR);

    try {
        const [shareRemoved, audioRemoved] = await Promise.all([
            cleanupDir(sharedDir, SHARE_MAX_AGE_MS),
            cleanupDir(audioDir, AUDIO_MAX_AGE_MS),
        ]);

        console.log(
            `[cleanup] removed ${shareRemoved} share file(s) older than 30d and ` +
            `${audioRemoved} audio file(s) older than 7d.`
        );
    } catch (error) {
        console.error('[cleanup] pass failed:', error);
    }
}

/**
 * Run cleanup once at startup, then every 24 hours. The interval is unref'd so
 * it never keeps the process alive on its own.
 */
export function startCleanupJob(): void {
    void runCleanup();
    const timer = setInterval(() => void runCleanup(), DAY_MS);
    timer.unref?.();
}
