import { z } from 'zod';
import  * as dotenv from 'dotenv'

dotenv.config({
    path: import.meta.resolve("../.env"),
})

export const envSchema = z.object({
    NODE_ENV: z.string().optional(),
    PORT: z.coerce.number().int().positive(),
    THREAD_COUNT: z.coerce.number().int().positive().optional(),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    S3_ENDPOINT: z.string().min(1),
    S3_BUCKET_NAME: z.string().min(1),
    S3_TLS: z.boolean().optional().default(false),
    MODELS_DIR: z.string(),
    AUDIO_DIR: z.string(),
    FFMPEG_PATH: z.string().min(1),
    FFPROBE_PATH: z.string().min(1),

});

const validatedEnv = envSchema.parse(process.env);

export const env = validatedEnv;