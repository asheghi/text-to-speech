# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

Full-stack text-to-speech app. Frontend (React + Vite + MUI Joy + Tailwind) talks to an Express backend that wraps **sherpa-onnx** for offline TTS inference.

### Backend (`server/`)

Express app in `server/index.ts` mounting two surfaces:

1. **tRPC** at `/api/trpc` (`server/router.ts` → `server/routers/ttsRouter.ts`). Procedures: `getModelsList`, `getStorageStatus`, `shareContent`, `getSharedContent`. Shared content is persisted as JSON files under `data/shared/<nanoid>.json` — there is no database despite `mongoose` being a dependency.
2. **Raw HTTP** `GET/PUT /api/tts` and `/api/tts.wav` (`handleTTS`) — generates a single sentence as a WAV stream. Query params: `text`, `model`, `speed`. `PUT` returns 200 without the body (used by the frontend to warm the cache via `fetchUntilFirstByte`).

TTS pipeline (`server/lib/tts.ts`):
- `getTTS(modelName)` lazily instantiates and caches a `sherpa_onnx.OfflineTts` per model in a module-level `cache` object (process-lifetime). The cache is keyed by *source* model name — see "Aliases" below — so N picker entries that share one bundle hold one `OfflineTts` instance, not N.
- **Model family detection.** `tts.ts` supports two families: **VITS** (Piper, MMS, Coqui) and **Supertonic 3**. `detectFamily(files)` branches on `tts.json` + `unicode_indexer.bin` presence (Supertonic's discriminator). `createVitsTTS` / `createSupertonicTTS` build the family-specific `OfflineTts` config. Generation also branches: VITS uses the flat `tts.generate({ text, sid, speed, enableExternalBuffer })`; Supertonic requires `tts.generate({ text, generationConfig: new sherpa_onnx.GenerationConfig({ sid, speed, extra: { lang } }) })` because `extra.lang` is its language selector at inference time.
- **Model sources.** Three of them, all merged into one list by `fetchModelsList`:
  1. The `k2-fsa/sherpa-onnx` `tts-models` GitHub release (auto-discovered via the GitHub API; falls back to bundled `server/lib/models.json` snapshot when GitHub is unreachable). Single-tarball Piper/Supertonic/etc. bundles.
  2. **Third-party models** in `server/lib/customModels.ts`. Carry a `postProcess` strategy (`'none'` or `'piper-raw'`), an optional `innerPath` for archives whose root dir ≠ modelName, and an optional `rawFiles` list for bundles that ship loose files (e.g. Hugging Face MMS) instead of a tarball. `downloadModel.ts` branches on `findCustomModel(name)` and handles extraction + post-processing.
  3. **Aliases** (also in `customModels.ts`). An entry with `aliasOf: '<sourceModelName>'` shares the source's downloaded files and in-memory `OfflineTts`; only `defaultSid` and/or `defaultLang` are overridden. Used to expose multi-voice / multi-language bundles as N picker entries with zero extra disk — e.g. Supertonic 3 is registered once and exposed as 40 entries (10 Swedish voices + 30 other languages).
- **Piper raw → sherpa-onnx conversion** (`server/lib/convertPiperModel.ts`). Some third-party Piper voices ship raw (`.onnx` + `.onnx.json`, no `tokens.txt`, no `espeak-ng-data`, no sherpa metadata in the ONNX). The converter does, in pure JS: (a) generate `tokens.txt` from `phoneme_id_map`, (b) inject sherpa metadata by appending `metadata_props` entries to the end of the protobuf (concat-as-merge — safe and avoids a Python dependency), (c) symlink a shared `MODELS_DIR/_espeak-ng-data/` (copied once from any sibling Piper voice or downloaded standalone). When the `.onnx.json` is missing too, falls back to `CustomModel.piperFallback` defaults + borrows `tokens.txt` from a sibling Piper voice (safe because same-language Piper voices share identical `phoneme_id_map`).
- Generated audio is content-addressed: `objectHash({ modelName, text, speed, sid, lang }) + '.wav'` in `env.AUDIO_DIR`. `sid` + `lang` are in the key so multi-voice / multi-language aliases don't collide on the same WAV. If `NO_AUDIO_CACHE=true`, files are deleted after the response is sent.
- Threads: `THREAD_COUNT` env or `os.cpus().length`.

The native sherpa-onnx libraries require `LD_LIBRARY_PATH` to include `node_modules/sherpa-onnx-linux-x64` (set in `dockerEntryPoint.sh`); replicate this when running the server outside Docker on Linux.

### Frontend (`src/`)

- React Router (`src/router.tsx`) with three routes under `RootLayout`: `/` (`IndexPage`, one-shot TTS form), `/reader` and `/reader/:shareId` (`ReaderPage`, sentence-by-sentence reader), `/status`.
- tRPC client wired in `src/TrpcWrapper.tsx`; typed via `AppRouter` imported from `server/trpc.ts` — **frontend and backend share types directly across the `server/` ↔ `src/` boundary**, so changing tRPC procedure signatures immediately affects the client.
- Reader flow (`src/pages/reader/ReaderPage.tsx`):
  - `splitToSentences` splits text on `.`, `?`, `!`, `:`, `;` while protecting quoted spans, then merges trailing punctuation-only fragments. Touch carefully — it has been iterated on for edge cases.
  - For each sentence it builds a `getTtsLink` URL pointing at `/api/tts.wav?...`.
  - `useAudioPlayer` (wraps `react-use-audio-player`) plays the current sentence; an effect preloads the next 3 sentences by issuing `PUT` requests via `fetchUntilFirstByte` so the server warms its cache before playback reaches them.
  - User selections (text, model, language, speed) are persisted in `localStorage` via `useLocalStorageState` (`src/lib/useLocalStorageState.ts`); `autoPlay` and `delay` are also stored there.
- Path aliases: `@/*` → `src/*`, `#/*` → `server/*` (tsconfig).

### Shared content / sharing

`shareContent` (tRPC mutation) writes a JSON blob under `data/shared/`. `IndexPage` calls it before navigating to `/reader/:shareId`, and `ReaderPage` loads it on mount via `getSharedContent`. When the user edits text in shared mode, the URL is rewritten back to `/reader` to drop the shareId.

### Configuration

`server/env.ts` validates env with Zod. Defaults: `PORT=8080`, `MODELS_DIR=data/models`, `AUDIO_DIR=data/audio`, `NO_AUDIO_CACHE=false`. `VITE_APP_TITLE` is also read here so the server-rendered `index.html` can substitute the `AppTitle` placeholder (`server/spaExpressRouter.ts`).

### Deployment

`Dockerfile` builds the frontend at image-build time and runs the server, which serves the built SPA from `dist/` via `SpaExpressRouter` (catch-all `*` returning `index.html` after static asset middleware). Persistent state goes under `/data` (mount a volume there).
