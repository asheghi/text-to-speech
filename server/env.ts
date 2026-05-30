import { z } from 'zod';
import * as dotenv from 'dotenv'

dotenv.config({
    path: import.meta.resolve("../.env"),
})

export const envSchema = z.object({
    NODE_ENV: z.string().optional(),
    PORT: z.coerce.number().int().positive().default(8080),
    THREAD_COUNT: z.coerce.number().int().positive().optional(),
    MODELS_DIR: z.string().default('data/models'),
    AUDIO_DIR: z.string().default('data/audio'),
    VITE_APP_TITLE: z.string().default('Text to speech'),
    /** skip storing audio files into cache */
    NO_AUDIO_CACHE: z.coerce.boolean().default(false),
    /** secret token that bypasses rate limiting */
    API_KEY: z.string().optional(),
    /** comma-separated IPs that bypass rate limiting */
    ALLOWED_IPS: z.string().optional(),
    /** max requests per window for unauthenticated clients */
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
    /** rate limit window in milliseconds */
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60 * 60 * 1000),
    /** max requests per window for unauthenticated clients on /api/trpc */
    TRPC_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
    /** tRPC rate limit window in milliseconds (default 15 minutes) */
    TRPC_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    /** max text length (chars) for unauthenticated requests; 0 = no limit */
    PUBLIC_MAX_TEXT_LENGTH: z.coerce.number().int().min(0).default(200),
    /** max concurrent TTS generations across the whole process (CPU-bound) */
    MAX_CONCURRENT_GENERATIONS: z.coerce.number().int().positive().default(1),
    /** max /api/tts requests per window for privileged clients */
    PRIVILEGED_TTS_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(500),
    /** privileged /api/tts rate limit window in milliseconds (default 1 hour) */
    PRIVILEGED_TTS_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60 * 60 * 1000),
});

const validatedEnv = envSchema.parse(process.env);

export const env = validatedEnv;