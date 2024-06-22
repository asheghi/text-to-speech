import { DefinitionType, Definition } from "../mongoose";
import { t } from "../trpc";
import z from 'zod'

export const wordRouter = t.router({
    getCount: t.procedure
        .query(async (): Promise<number> => {
            const count = await Definition.countDocuments({})
            console.log({ count });
            return count;
        }),
    getWordsList: t.procedure
        .query((): Promise<{ _id: string, word: string }[]> => {
            return Definition.find({}, { word: 1 })
        }),
    getWord: t.procedure
        .input(z.object({ word: z.string().min(1) }))
        .query(({ input }): Promise<DefinitionType | null> => {
            return Definition.findOne({ word: input.word })
        })
})