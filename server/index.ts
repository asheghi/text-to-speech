/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { type Request, type Response } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc';
import { appRouter } from './router';
import cors from 'cors'
import { generateSentence } from './lib/tts'
import fs from 'fs'
import { env } from './env';


console.log("Starting server ...");

const app = express();

app.use(cors())

app.use(
    '/api/trpc',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext,
    })
);

app.get('/api/tts', async (req, res) => {
    const { text, model, } = req.query;
    // validate inputs
    if (!text || !model) {
        res.status(400).send('Missing required parameters.');
        return;
    }
    // validate length and type 
    if (typeof text !== 'string' || typeof model !== 'string') {
        res.status(400).send('Invalid parameters.');
        return;
    }

    let filePath;
    try {
        filePath = await generateSentence(model as string, text as string)
    } catch (error) {
        console.error(error)
        return res.status(500).send("failed to generate audio");
    }

    if (!fs.existsSync(filePath)) {
        return res.status(500).send('failed to get generated audio.');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'inline; filename="speech.wav"');

    const readStream = fs.createReadStream(filePath);

    readStream.pipe(res);

    readStream.on('error', (error) => {
        console.error('Error streaming the file:', error);
        res.status(500).send('Error streaming the file');
    });

});

app.listen(env.PORT, () => {
    console.log("Server is listening on http://localhost:" + env.PORT + " 🚀");
})