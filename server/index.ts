/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { type Request, type Response } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc';
import { appRouter } from './router';
import cors from 'cors'


console.log("Starting server ...");

const app = express();

app.use('/trpc', cors({}))

app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext,
    })
);


app.listen(3003, () => {
    console.log("Server is listening on http://localhost:3003 🚀");
})