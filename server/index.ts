import express, { type Request, type Response } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc';
import { appRouter } from './router';
import cors from 'cors'
import { generateSentence, DEFAULT_STEPS, MIN_STEPS, MAX_STEPS, DEFAULT_VOICE_STYLE } from './lib/tts'
import { SUPERTONIC_VOICE_IDS } from './lib/supertonicVoices'
import type { VoiceStyleId } from './lib/supertonicVoices'
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

const handleTTS = async (req: Request, res: Response) => {
    const { text, model, speed, steps, voiceStyle } = req.query;
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

    // steps: integer in [MIN_STEPS, MAX_STEPS], defaults to DEFAULT_STEPS
    let parsedSteps = DEFAULT_STEPS;
    if (steps) {
        parsedSteps = parseInt(steps as string, 10);
        if (isNaN(parsedSteps)) return res.status(400).send('invalid steps parameter.');
        parsedSteps = Math.max(MIN_STEPS, Math.min(MAX_STEPS, parsedSteps));
    }

    // voiceStyle: one of the known Supertonic voice IDs, defaults to DEFAULT_VOICE_STYLE
    let parsedVoiceStyle: VoiceStyleId = DEFAULT_VOICE_STYLE;
    if (voiceStyle && typeof voiceStyle === 'string') {
        if (SUPERTONIC_VOICE_IDS.includes(voiceStyle as VoiceStyleId)) {
            parsedVoiceStyle = voiceStyle as VoiceStyleId;
        }
        // invalid value silently falls back to default
    }

    let filePath: string;
    let cached: boolean;
    try {
        ({ filePath, cached } = await generateSentence(
            model,
            text,
            speed ? parsedSpeed : 1,
            parsedSteps,
            parsedVoiceStyle,
        ));
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
        'Content-Length': fileSize,
        'Content-Disposition': `inline; filename="speech.wav"`,
        'Cache-Control': 'public, max-age=604800',
        'X-Cache': cached ? 'HIT' : 'MISS',
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
