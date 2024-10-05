import { ModelType, fetchModelsList } from "../lib/fetchModelsList";
import { t } from "../trpc";
import { getUsedStorageStats  } from "../lib/getStorageStatus"

export const ttsRouter = t.router({
    getModelsList: t.procedure
        .query(async (): Promise<ModelType[]> => {
            return fetchModelsList();
        }),
    getStorageStatus: t.procedure
        .query(async () => {
            return getUsedStorageStats()
        })
})