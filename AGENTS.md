# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

Runtime is **Bun** (Node-compatible APIs are also used). Install with `bun install`.

- `bun run dev` — Vite dev server for the React frontend.
- `bun run dev:server` — backend in watch mode (`bun run --watch server/index.ts`).
- `bun run build` — `tsc` typecheck + `vite build` (production frontend bundle into `dist/`).
- `bun run lint` — ESLint over `.ts`/`.tsx` with `--max-warnings 0` (fails on warnings).
- `bun run preview` — preview a built frontend.

Dev requires running **both** processes. The Vite dev server proxies `/api` to `http://localhost:3122`, but the backend's default `PORT` is `8080` — when running locally, start the server with `PORT=3122 bun run dev:server` (or change the proxy) or the frontend won't reach it.

There is no test runner configured.

## Architecture

Full-stack text-to-speech app. Frontend (React + Vite + MUI Joy + Tailwind) talks to an Express backend that supports two TTS families: **sherpa-onnx** (for Piper/VITS/Kitten) and a **native onnxruntime-node engine** (for Supertonic 3).

### Backend (`server/`)

Express app in `server/index.ts` mounting two surfaces:

1. **tRPC** at `/api/trpc` (`server/router.ts` → `server/routers/ttsRouter.ts`). Procedures: `getModelsList`, `getStorageStatus`, `shareContent`, `getSharedContent`. Shared content is persisted as JSON files under `data/shared/<nanoid>.json` — there is no database despite `mongoose` being a dependency.
2. **Raw HTTP** `GET/PUT /api/tts` and `/api/tts.wav` (`handleTTS`) — generates a single sentence as a WAV stream. Query params: `text`, `model`, `speed`, `steps`, `voiceStyle`. `PUT` returns 200 without the body (used by the frontend to warm the cache via `fetchUntilFirstByte`).

TTS pipeline (`server/lib/tts.ts`):
- `getTTS(modelName)` lazily instantiates and caches a TTS instance per model (process-lifetime). The cache is keyed by *source* model name — see "Aliases" below.
- **Model family detection.** `detectFamily(files)` branches on file presence: `tts.json` + `unicode_indexer.*` → `'supertonic'`, `voices.bin` → `'kitten'`, else → `'vits'`.
- **Supertonic 3 family** uses the native engine in `server/lib/supertonicEngine.ts` (TypeScript port of the official `helper.js` from `supertone-inc/supertonic`). It drives `onnxruntime-node` directly — **not sherpa-onnx** — which exposes `totalStep` and named voice styles. Key params: `lang`, `voiceStyleId` (M1–M5/F1–F5), `totalStep` (2–16, default 8), `speed`. The k2-fsa int8 bundle is used for the 4 ONNX files; supplementary assets (`unicode_indexer.json` from `onnx/` and 10 voice style JSONs from `voice_styles/`) are downloaded from the official `Supertone/supertonic-3` HF repo as `extraFiles`.
- **VITS / Kitten families** still use `sherpa-onnx-node` unchanged.
- **`generateSentence` signature:** `(modelName, text, speed, steps=8, voiceStyle='M1')`. Cache key: `objectHash({ modelName, text, speed, lang, steps, voiceStyle })`. Old entries keyed by `{..., sid, lang}` are orphaned but harmless.
- **Model sources.** Three of them, merged by `fetchModelsList`:
  1. The `k2-fsa/sherpa-onnx` `tts-models` GitHub release (auto-discovered; falls back to `server/lib/models.json` snapshot).
  2. **Third-party models** in `server/lib/customModels.ts`. Fields: `postProcess`, `innerPath`, `rawFiles`, `extraFiles` (downloaded after main archive, idempotent), `defaultLang`, `family`, `aliasOf`.
  3. **Aliases** — `aliasOf: '<source>'` shares files + TTS instance, overrides `defaultLang`. Supertonic has 31 language entries (1 source + 30 aliases). Voice style is now a separate UI param, not aliased — the old v1–v9 Swedish voice aliases were removed.
- **`extraFiles`** on a `CustomModel` are downloaded by `downloadExtraFiles()` in `downloadModel.ts`. Called both on first download AND when the model dir already exists (migration-safe). `createTTS` always calls `downloadModel` to trigger this check.
- **Piper raw → sherpa-onnx conversion** (`server/lib/convertPiperModel.ts`). Pure-JS converter for raw Piper bundles (no `tokens.txt`, no espeak metadata). Injects sherpa metadata via protobuf append.
- Threads: `THREAD_COUNT` env or `os.cpus().length`.

The native sherpa-onnx libraries require `LD_LIBRARY_PATH` to include `node_modules/sherpa-onnx-linux-x64` (set in `dockerEntryPoint.sh`); replicate this when running the server outside Docker on Linux.

### Supertonic voice constants (`server/lib/supertonicVoices.ts`)

Shared between server and frontend (importable via `#/lib/supertonicVoices` — the `#` Vite alias maps to `server/`). Exports:
- `SUPERTONIC_VOICES` — 10 entries: M1(Alex), M2(James), M3(Robert), M4(Sam), M5(Daniel), F1(Sarah), F2(Lily), F3(Jessica), F4(Olivia), F5(Emily)
- `DEFAULT_VOICE_STYLE = 'M1'`, `DEFAULT_STEPS = 8`, `MIN_STEPS = 2`, `MAX_STEPS = 16`

### Frontend (`src/`)

- React Router (`src/router.tsx`) with three routes under `RootLayout`: `/` (`IndexPage`, one-shot TTS form), `/reader` and `/reader/:shareId` (`ReaderPage`, sentence-by-sentence reader), `/status`.
- tRPC client wired in `src/TrpcWrapper.tsx`; typed via `AppRouter` imported from `server/trpc.ts` — **frontend and backend share types directly**, so changing tRPC procedure signatures immediately affects the client.
- Reader flow (`src/pages/reader/ReaderPage.tsx`):
  - `splitToSentences` splits text on `.`, `?`, `!`, `:`, `;` while protecting quoted spans. Touch carefully — it has been iterated on for edge cases.
  - For each sentence it builds a `getTtsLink(text, model, speed, steps, voiceStyle)` URL.
  - `useAudioPlayer` preloads the next 3 sentences via `PUT` requests (`fetchUntilFirstByte`).
  - `useSource()` (`src/pages/reader/hooks/useSource.ts`) persists all settings via `useLocalStorageState`: `text`, `model`, `language`, `speed`, `steps`, `voiceStyle`.
- **Supertonic settings panel** — rendered in `SpeakerModal` and `Form` when `selectedModelData?.family === 'supertonic'` (the `family` field comes from `ModelType` via the tRPC models list). Shows: Voice dropdown (M1–F5 with names), Quality Steps slider (2–16 with description).
- Path aliases: `@/*` → `src/*`, `#/*` → `server/*` (both tsconfig and vite.config.ts).

### Shared content / sharing

`shareContent` tRPC mutation stores `{ content, language, model, speed, steps, voiceStyle }` under `data/shared/`. `IndexPage` calls it before navigating to `/reader/:shareId`. `ReaderPage` restores all settings on mount.

### Configuration

`server/env.ts` validates env with Zod. Defaults: `PORT=8080`, `MODELS_DIR=data/models`, `AUDIO_DIR=data/audio`, `NO_AUDIO_CACHE=false`. `VITE_APP_TITLE` is also read here.

### Deployment

`Dockerfile` builds the frontend at image-build time and runs the server, which serves the built SPA from `dist/` via `SpaExpressRouter`. Persistent state goes under `/data` (mount a volume there).

## Known lint issues (pre-existing, not introduced here)

`bun run lint` fails with pre-existing warnings/errors in `server/seed/utils/lexikon.ts`, `server/trpc.ts`, `src/pages/reader/ReaderPage.tsx` (unused eslint-disable), and `src/pages/reader/hooks/useAudioPlayer.ts` (react-hooks/exhaustive-deps). These are not related to the Supertonic engine work.
