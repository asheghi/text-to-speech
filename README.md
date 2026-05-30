
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

---

## Models

### Supertonic 3

A high-quality multilingual neural TTS engine (~128 MB, 44.1 kHz output). Exposes named voice styles and configurable synthesis quality steps. Select a language by choosing the matching model name.

**Model names:** `supertonic-3-<lang>-int8`

**Supported languages (31):**

| Code | Language   | Code | Language    | Code | Language   |
|------|------------|------|-------------|------|------------|
| `ar` | Arabic     | `fr` | French      | `ro` | Romanian   |
| `bg` | Bulgarian  | `hi` | Hindi       | `ru` | Russian    |
| `cs` | Czech      | `hr` | Croatian    | `sk` | Slovak     |
| `da` | Danish     | `hu` | Hungarian   | `sl` | Slovenian  |
| `de` | German     | `id` | Indonesian  | `sv` | Swedish    |
| `el` | Greek      | `it` | Italian     | `tr` | Turkish    |
| `en` | English    | `ja` | Japanese    | `uk` | Ukrainian  |
| `es` | Spanish    | `ko` | Korean      | `vi` | Vietnamese |
| `et` | Estonian   | `lt` | Lithuanian  |      |            |
| `fi` | Finnish    | `lv` | Latvian     |      |            |
| `nl` | Dutch      | `pl` | Polish      |      |            |
|      |            | `pt` | Portuguese  |      |            |

**Voice styles (10):**

| ID   | Name    | Gender |
|------|---------|--------|
| `M1` | Alex    | Male   |
| `M2` | James   | Male   |
| `M3` | Robert  | Male   |
| `M4` | Sam     | Male   |
| `M5` | Daniel  | Male   |
| `F1` | Sarah   | Female |
| `F2` | Lily    | Female |
| `F3` | Jessica | Female |
| `F4` | Olivia  | Female |
| `F5` | Emily   | Female |

**License:** OpenRAIL-M (commercial use generally permitted with RAIL restrictions)

---

### Swedish Piper — Axel

`vits-piper-sv_SE-axel-medium` — Swedish male voice, 22 kHz, ~58 MB.  
**License:** CC-BY 4.0

---

### MMS-TTS Swedish

`vits-mms-sv` — Swedish female voice, 16 kHz (lower fidelity), ~114 MB.  
**⚠ Non-commercial use only.**  
**License:** CC-BY-NC-4.0

---

### Community models (sherpa-onnx)

200+ additional voices spanning 46+ languages are auto-discovered from the [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) release at startup. Browse them in the UI model picker or via the `tts.getModelsList` tRPC query.

---

## API

### `GET /api/tts` · `GET /api/tts.wav`

Stream synthesized audio as a WAV file.

| Parameter    | Type   | Required | Default | Notes                                                           |
|--------------|--------|----------|---------|-----------------------------------------------------------------|
| `text`       | string | ✓        | —       | Text to synthesize                                              |
| `model`      | string | ✓        | —       | Model name (e.g. `supertonic-3-en-int8`)                        |
| `speed`      | float  |          | `1.0`   | Playback speed multiplier                                       |
| `steps`      | int    |          | `8`     | Synthesis quality steps, `2`–`16` (Supertonic only)             |
| `voiceStyle` | string |          | `M1`    | Voice style ID (`M1`–`F5`, Supertonic only; ignored otherwise) |

**Response headers:**

| Header          | Values         | Notes                              |
|-----------------|----------------|------------------------------------|
| `Content-Type`  | `audio/wave`   |                                    |
| `X-Cache`       | `HIT` / `MISS` | Whether audio was served from cache |
| `Cache-Control` | `public, max-age=604800` | 7-day browser cache      |

### `PUT /api/tts`

Same parameters as `GET`. Returns `200` with no body — used to warm the server-side audio cache without downloading the audio.

---

### tRPC (`/api/trpc`)

| Procedure               | Type     | Description                                      |
|-------------------------|----------|--------------------------------------------------|
| `tts.getModelsList`     | query    | Returns all available models with metadata       |
| `tts.getStorageStatus`  | query    | Returns disk usage for models and cached audio   |
| `tts.shareContent`      | mutation | Stores text + settings and returns a `shareId`   |
| `tts.getSharedContent`  | query    | Retrieves shared content by `shareId`            |
