/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { type Request, type Response } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc';
import { appRouter } from './router';
import cors from 'cors'
import { generateSentence } from './lib/tts'
import fs from 'fs'
import { env } from './env';
import { SpaExpressRouter } from './spaExpressRouter';


console.log("Starting server ...");

const app = express();



app.use('/api/trpc', cors())

app.use(
    '/api/trpc',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext,
    })
);

const handleTTS = async (req, res) => {
    const { text, model, } = req.query;
    // log request
    console.log(`Received request for TTS with model ${model} and text "${text}"`);

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
        filePath = await generateSentence(model as string, text as string);
    } catch (error) {
        console.error(error);
        console.error("failed to generate file");
        return res.status(500).send("failed to generate audio");
    }

    if (!fs.existsSync(filePath)) {
        console.error("generated file doesn't exists!");
        return res.status(500).send('failed to get generated audio.');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    res.writeHead(200, {
        'Content-Type': 'audio/wave',
        "Content-Length": fileSize,
        'Content-Disposition': 'inline; filename="speech.wav"',
    });

    // res.setHeader('Content-Length', fileSize);
    // res.setHeader('Content-Type', 'audio/wav');
    // res.setHeader('Content-Disposition', 'inline; filename="speech.wav"');
    // res.set('Cache-Control', 'public, max-age=604800');

    const readStream = fs.createReadStream(filePath);

    readStream.pipe(res);

    readStream.on('error', (error) => {
        console.error('Error streaming the file:');
        console.log(error);
        res.status(500).send('Error streaming the file');
    });

};
app.all('/api/tts', handleTTS);
app.get('/api/tts.wav', handleTTS);


app.use(SpaExpressRouter('dist'));



app.listen(env.PORT, '0.0.0.0', () => {
    console.log("Server is listening on http://localhost:" + env.PORT + " 🚀");
})