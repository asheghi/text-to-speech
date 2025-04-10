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

const handleTTS = async (req: Request, res) => {
    const { text, model, speed } = req.query;
    console.log(`Received request for TTS with model ${model} and text "${text}"`);

    if (!text || !model) {
        return res.status(400).send('Missing required parameters.');
    }

    if (typeof text !== 'string' || typeof model !== 'string') {
        return res.status(400).send('Invalid parameters.');
    }

    const parsedSpeed = parseFloat(speed as string);
    if (speed && isNaN(parsedSpeed)) {
        return res.status(400).send("invalid speed parameter.")
    }

    let filePath;
    try {
        filePath = await generateSentence(model as string, text as string, speed ? parsedSpeed : 1);
    } catch (error) {
        console.error(error);
        console.error("failed to generate file");
        return res.status(500).send("failed to generate audio");
    }

    if (!fs.existsSync(filePath)) {
        console.error("generated file doesn't exists!");
        return res.status(500).send('failed to get generated audio.');
    }

    if (req.method === 'PUT') {
        return res.send();
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;



    res.writeHead(200, {
        'Content-Type': 'audio/wave',
        "Content-Length": fileSize,
        'Content-Disposition': `inline; filename="speech.wav"`,
        'Cache-Control': 'public, max-age=604800'
    });

    const readStream = fs.createReadStream(filePath);

    readStream.pipe(res);

    readStream.on('error', (error) => {
        console.error('Error streaming the file:');
        console.log(error);
        res.status(500).send('Error streaming the file');
    });

    if (env.NO_AUDIO_CACHE) {
        res.on('finish', () => {
            fs.unlinkSync(filePath)
        })
    }
};
app.all('/api/tts', handleTTS);
app.all('/api/tts.wav', handleTTS);


app.use(SpaExpressRouter('dist'));



app.listen(env.PORT, '0.0.0.0', () => {
    console.log("Server is listening on http://localhost:" + env.PORT + " 🚀");
})