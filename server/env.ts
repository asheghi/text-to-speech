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
});

const validatedEnv = envSchema.parse(process.env);

export const env = validatedEnv;