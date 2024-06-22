import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.string().optional(),
    PORT: z.number().int().positive(),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    S3_ENDPOINT: z.string().min(1),
    S3_BUCKET_NAME: z.string().min(1),
    S3_TLS: z.boolean().default(false),
});

const validatedEnv = envSchema.parse(process.env);

export const env = validatedEnv;