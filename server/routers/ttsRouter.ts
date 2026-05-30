import { ModelType, fetchModelsList } from "../lib/fetchModelsList";
import { t } from "../trpc";
import { getUsedStorageStats  } from "../lib/getStorageStatus";
import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import * as fs from "fs";
import * as path from "path";

/** nanoid output alphabet; ids are 1–21 chars of [A-Za-z0-9_-]. */
const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{1,21}$/;

export const ttsRouter = t.router({
    getModelsList: t.procedure
        .query(async (): Promise<ModelType[]> => {
            return fetchModelsList();
        }),
    getStorageStatus: t.procedure
        .query(async () => {
            return getUsedStorageStats()
        }),
    shareContent: t.procedure
        .input(z.object({
            content: z.string().min(1).max(100000),
            title: z.string().max(500).optional(),
            language: z.string().max(50).optional(),
            model: z.string().max(200).optional(),
            speed: z.number().min(0.1).max(5.0).optional(),
            steps: z.number().int().min(2).max(16).optional(),
            voiceStyle: z.string().regex(/^[MF][1-5]$/).optional(),
        }))
        .mutation(async ({ input }) => {
            const shareId = nanoid(10); // Generate a short unique ID

            // Create shared directory if it doesn't exist
            const sharedDir = path.join(process.cwd(), 'data', 'shared');
            if (!fs.existsSync(sharedDir)) {
                fs.mkdirSync(sharedDir, { recursive: true });
            }

            // Create content object
            const contentData = {
                content: input.content,
                title: input.title || 'Shared Text',
                language: input.language,
                model: input.model,
                speed: input.speed,
                steps: input.steps,
                voiceStyle: input.voiceStyle,
                createdAt: new Date().toISOString()
            };
            
            // Save content to file
            const filePath = path.join(sharedDir, `${shareId}.json`);
            fs.writeFileSync(filePath, JSON.stringify(contentData, null, 2), 'utf8');
            
            return {
                shareId
            };
        }),
    getSharedContent: t.procedure
        .input(z.object({
            shareId: z.string()
        }))
        .query(async ({ input }) => {
            // Validate the shareId against nanoid's alphabet before using it in a
            // file path. This prevents path-traversal (e.g. "../../etc/passwd").
            if (!SHARE_ID_PATTERN.test(input.shareId)) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Shared content not found' });
            }

            const sharedDir = path.join(process.cwd(), 'data', 'shared');
            const filePath = path.join(sharedDir, `${input.shareId}.json`);

            if (!fs.existsSync(filePath)) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Shared content not found' });
            }
            
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const contentData = JSON.parse(fileContent);
            
            return {
                content: contentData.content,
                title: contentData.title,
                language: contentData.language,
                model: contentData.model,
                speed: contentData.speed,
                steps: contentData.steps,
                voiceStyle: contentData.voiceStyle,
                createdAt: contentData.createdAt
            };
        })
})