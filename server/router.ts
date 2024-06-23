import { z } from 'zod';
import { t } from './trpc';
import { ttsRouter } from './routers/ttsRouter'

export const appRouter = t.router({
    tts: ttsRouter,
    getUser: t.procedure.input(z.string()).query((opts) => {
        opts.input; // string
        return { id: opts.input, name: 'Bilbo' };
    }),
    createUser: t.procedure
        .input(z.object({ name: z.string().min(5) }))
        .mutation(async (opts) => {
            // use your ORM of choice
            return opts.input.name;
        }),
});
