import { ModelType, fetchModelsList } from "../lib/fetchModelsList";
import { t } from "../trpc";
import { getUsedStorageStats  } from "../lib/getStorageStatus";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as fs from "fs";
import * as path from "path";

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
            content: z.string().min(1),
            title: z.string().optional()
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
            const sharedDir = path.join(process.cwd(), 'data', 'shared');
            const filePath = path.join(sharedDir, `${input.shareId}.json`);
            
            if (!fs.existsSync(filePath)) {
                throw new Error('Shared content not found');
            }
            
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const contentData = JSON.parse(fileContent);
            
            return {
                content: contentData.content,
                title: contentData.title,
                createdAt: contentData.createdAt
            };
        })
})