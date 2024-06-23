import { ModelType, fetchModelsList } from "../lib/fetchModelsList";
import { t } from "../trpc";

export const ttsRouter = t.router({
    getModelsList: t.procedure
        .query(async (): Promise<ModelType[]> => {
            return fetchModelsList();
        }),
})