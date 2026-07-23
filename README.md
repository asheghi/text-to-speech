# Tala Text To Speech

Tala Text To Speech is a self-hostable full-stack text-to-speech app built with TypeScript, React, Vite, Express, and Bun. It generates WAV audio from text using Supertonic 3 through `onnxruntime-node`, plus Piper/VITS/Kitten models through `sherpa-onnx`.

## Features

- Generate speech from text in the browser.
- Read longer text sentence by sentence with pause, resume, loop, and preloading.
- Share reader sessions with text and voice settings.
- Use a simple HTTP API for WAV output.
- Browse Supertonic 3, Piper, VITS, Kitten, and community `sherpa-onnx` models.

## Installation

```bash
docker build -t tala-text-to-speech .
docker run -v ./path-to-dir:/data -p 3001:8080 --name tala-text-to-speech tala-text-to-speech
```

Persistent app data, downloaded models, cached audio, and shared content are stored under `/data` in the container.

## Development

Install dependencies:

```bash
bun install
```

Run the backend and frontend in separate terminals:

```bash
PORT=3122 bun run dev:server
bun run dev
```

The Vite dev server proxies `/api` to `http://localhost:3122`. The backend defaults to `8080`, so use `PORT=3122` for local development unless you also update the Vite proxy.

Useful commands:

```bash
bun run build
bun run lint
bun run preview
```

## Configuration

Environment variables are validated in `server/env.ts`.

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | Express server port |
| `MODELS_DIR` | `data/models` | Downloaded model storage |
| `AUDIO_DIR` | `data/audio` | Cached WAV output storage |
| `NO_AUDIO_CACHE` | `false` | Skip writing generated audio to disk |
| `VITE_APP_TITLE` | `Tala Text To Speech` | App title/brand shown in the UI |
| `VITE_APP_DESCRIPTION` | app description | Default SEO description |
| `VITE_APP_URL` | request origin | Canonical production URL used for SEO tags, sitemap, and robots.txt |
| `API_KEY` | unset | Secret token for privileged API calls |
| `ALLOWED_IPS` | unset | Comma-separated IPs that bypass public rate limits |
| `PUBLIC_MAX_TEXT_LENGTH` | `200` | Max text length for public callers; `0` disables the cap |
| `MAX_CONCURRENT_GENERATIONS` | `1` | Global concurrent TTS generation limit |

On Linux, running the server outside Docker may require `LD_LIBRARY_PATH` to include `node_modules/sherpa-onnx-linux-x64`.

## Models

### Supertonic 3

A high-quality multilingual neural TTS engine with 44.1 kHz output, named voice styles, and configurable synthesis quality steps.

**Model names:** `supertonic-3-<lang>-int8`

**Supported languages (31):**

| Code | Language | Code | Language | Code | Language |
| --- | --- | --- | --- | --- | --- |
| `ar` | Arabic | `fr` | French | `ro` | Romanian |
| `bg` | Bulgarian | `hi` | Hindi | `ru` | Russian |
| `cs` | Czech | `hr` | Croatian | `sk` | Slovak |
| `da` | Danish | `hu` | Hungarian | `sl` | Slovenian |
| `de` | German | `id` | Indonesian | `sv` | Swedish |
| `el` | Greek | `it` | Italian | `tr` | Turkish |
| `en` | English | `ja` | Japanese | `uk` | Ukrainian |
| `es` | Spanish | `ko` | Korean | `vi` | Vietnamese |
| `et` | Estonian | `lt` | Lithuanian |  |  |
| `fi` | Finnish | `lv` | Latvian |  |  |
| `nl` | Dutch | `pl` | Polish |  |  |
|  |  | `pt` | Portuguese |  |  |

**Voice styles:**

| ID | Name | Gender |
| --- | --- | --- |
| `M1` | Alex | Male |
| `M2` | James | Male |
| `M3` | Robert | Male |
| `M4` | Sam | Male |
| `M5` | Daniel | Male |
| `F1` | Sarah | Female |
| `F2` | Lily | Female |
| `F3` | Jessica | Female |
| `F4` | Olivia | Female |
| `F5` | Emily | Female |

**License:** OpenRAIL-M.

### Swedish Piper - Axel

`vits-piper-sv_SE-axel-medium` is a Swedish male voice at 22 kHz.

**License:** CC-BY 4.0.

### MMS-TTS Swedish

`vits-mms-sv` is a Swedish female voice at 16 kHz.

**License:** CC-BY-NC-4.0. Non-commercial use only.

### Community Models

Additional voices are auto-discovered from the `k2-fsa/sherpa-onnx` TTS model release at startup. Browse them in the UI model picker or through the `tts.getModelsList` tRPC query.

## API

### `GET /api/tts` and `GET /api/tts.wav`

Streams synthesized audio as a WAV file.

| Parameter | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `text` | string | yes | - | Text to synthesize |
| `model` | string | yes | - | Model name, such as `supertonic-3-en-int8` |
| `speed` | number | no | `1.0` | Playback speed multiplier |
| `steps` | integer | no | `8` | Supertonic synthesis quality steps, from `2` to `16` |
| `voiceStyle` | string | no | `M1` | Supertonic voice style ID, from `M1` to `F5` |

Example:

```bash
curl -G 'http://localhost:3122/api/tts.wav' \
  --data-urlencode 'text=Hello from Tala Text To Speech.' \
  --data-urlencode 'model=supertonic-3-en-int8' \
  --data-urlencode 'voiceStyle=F1' \
  --data-urlencode 'speed=1.0' \
  --data-urlencode 'steps=8' \
  --output hello.wav
```

Response headers include:

| Header | Values | Notes |
| --- | --- | --- |
| `Content-Type` | `audio/wave` | WAV audio stream |
| `X-Cache` | `HIT` / `MISS` | Whether audio was served from cache |
| `Cache-Control` | `public, max-age=604800` | 7-day browser cache |

### `PUT /api/tts`

Accepts the same parameters as `GET` and returns `200` without a body. The frontend uses this to warm the server-side audio cache.

### tRPC (`/api/trpc`)

| Procedure | Type | Description |
| --- | --- | --- |
| `tts.getModelsList` | query | Returns all available models with metadata |
| `tts.getStorageStatus` | query | Returns disk usage for models and cached audio |
| `tts.shareContent` | mutation | Stores text and settings, then returns a `shareId` |
| `tts.getSharedContent` | query | Retrieves shared content by `shareId` |
