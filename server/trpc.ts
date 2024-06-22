/* eslint-disable @typescript-eslint/no-unused-vars */
import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { ZodError } from 'zod';
import { appRouter } from './router';


// created for each request
export const createContext = ({
    req,
    // res,
}: trpcExpress.CreateExpressContextOptions) => ({
    url: req.url,
});

export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create({
    errorFormatter(opts) {
        const { shape, error } = opts;
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
                        ? error.cause.flatten()
                        : null,
            },
        };
    },
});

export type AppRouter = typeof appRouter;