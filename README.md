
# BabbleBot

A full-stack text-to-speech application built with TypeScript for execution on Bun.js/Node.js runtimes. Utilizes Sherpa-ONNX to generate audio from input text.

**Generate Audio from Text**
Convert written text into spoken audio in a chosen language and voice model.

**Sentence-by-Sentence Reader**
Listen to text, one sentence at a time, with the option to pause or resume playback.

**Fetch Audio Models List**
Browse through 46+ supported languages and over 200+ available voice models.

## Installation

```bash
docker build -t babble-bot
docker run -v ./path-to-dir:/data -p 3001:8080 --name babble babble-bot
```

## Development

```bash
# run back-end
bun run --watch server/index.ts

# run front-end
bun run dev
```
