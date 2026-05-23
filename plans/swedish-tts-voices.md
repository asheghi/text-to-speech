# Swedish TTS quality + multilingual voices

Plan and decision log for the work that expanded this app from 3 Piper Swedish voices to 20 Swedish voices (across 3 model families) plus 30 other languages.

## Current state

### Picker contents (Swedish only — full list of voices today)

| modelName | Family | Sample rate | License | Notes |
|---|---|---|---|---|
| `supertonic-3-sv-int8` | Supertonic 3 | **44.1 kHz** | OpenRAIL-M | Default Swedish Supertonic voice (sid=0). The "love it" voice. |
| `supertonic-3-sv-int8-v1` … `-v9` | Supertonic 3 | 44.1 kHz | OpenRAIL-M | 9 voice-style aliases of the above; same files, different sid 1..9 |
| `vits-piper-sv_SE-alma-medium` (+ `-int8`, `-fp16`) | Piper VITS | 22.05 kHz | MIT | k2-fsa release; reliable baseline. fp16 crashes on CPU. |
| `vits-piper-sv_SE-lisa-medium` (+ `-int8`, `-fp16`) | Piper VITS | 22.05 kHz | MIT | k2-fsa release. |
| `vits-piper-sv_SE-nst-medium` (+ `-int8`, `-fp16`) | Piper VITS | 22.05 kHz | MIT | k2-fsa release. |
| `vits-piper-sv_SE-axel-medium` | Piper VITS | 22.05 kHz | CC-BY 4.0 | Yeager third-party; raw Piper converted at download time. Lower quality than alma. |
| `vits-mms-sv` | VITS (MMS) | 16 kHz | **CC-BY-NC-4.0** | willwade HF conversion. Vintage character. **No commercial use.** |
| `vits-coqui-sv-cv` | VITS (Coqui) | varies | varies | Pre-existing; not touched this session. |

### Picker contents (non-Swedish Supertonic)

30 additional language entries via the alias mechanism: `supertonic-3-{en,ko,ja,ar,bg,cs,da,de,el,es,et,fi,fr,hi,hr,hu,id,it,lt,lv,nl,pl,pt,ro,ru,sk,sl,tr,uk,vi}-int8`. Each is sid=0 only (no voice variants per language — would be 270 picker rows; defer until specifically requested).

### Architecture summary

- Two TTS model families supported in `server/lib/tts.ts`: **VITS** and **Supertonic** — detected from bundle file presence (`tts.json` + `unicode_indexer.bin` → Supertonic, else VITS). Different `OfflineTts` config shape and different `tts.generate()` API per family (Supertonic requires `GenerationConfig` with `extra.lang`).
- Three model sources merged into one picker list:
  1. k2-fsa GitHub release (auto-discovered)
  2. Third-party in `customModels.ts` with `postProcess: 'piper-raw' | 'none'` + optional `innerPath` / `rawFiles`
  3. **Aliases** — `aliasOf: '<source>'` entries share files + in-memory instance with another model; override `defaultSid` / `defaultLang` only
- Pure-JS Piper-raw → sherpa-onnx converter (`convertPiperModel.ts`) — generates `tokens.txt`, injects ONNX metadata via protobuf append, manages shared `_espeak-ng-data/`. No Python dependency.

## What's left

Optional polish, in rough order of payoff:

### Product
1. **Default the picker to Supertonic.** New users land on Piper today. One-line change in `src/pages/reader/hooks/useSource.ts` — pick whichever Supertonic voice you like best and set as the localStorage default.
2. **Parallel + wider prefetch.** Supertonic takes ~2.5s/sentence (vs Piper's 160ms). The reader's prefetch is currently serial (`for await` in `loadSentences`, [ReaderPage.tsx](../src/pages/reader/ReaderPage.tsx)) for 3 sentences ahead. Switch to `Promise.all` and bump to 5–6 to hide the latency.
3. **`displayName` field on `ModelType`.** Picker shows raw `supertonic-3-sv-int8-v3` etc. Adding a `displayName` field on `ModelType` + a small dropdown change to render it lets entries show as "Supertonic Swedish · Voice 3" or similar. Hardest part is bikeshedding the format.
4. **Surface licenses in the UI.** `CustomModel.license` is logged at download time only. A badge next to picker entries ("CC-BY-NC" / "OpenRAIL-M") would prevent accidentally shipping the MMS voice in a commercial product.

### Cleanup
5. **`data/models/` orphans** — periodically prune model dirs whose `modelName` is no longer in the picker (e.g. when a bundle name changes).
6. **`server/lib/models.json` snapshot** is stale relative to the live k2-fsa release. Worth a refresh sometime — re-run `fetchModelsList` against the live API and save the response as the new offline fallback.

### Out of scope but worth knowing exists
7. **Voice variants per non-Swedish Supertonic language.** Today each non-sv language has just sid=0. To give, say, English 10 voices the way Swedish has 10: `Array.from({length: 9}, (_, i) => ({ ..., aliasOf: 'supertonic-3-sv-int8', defaultLang: 'en', defaultSid: i + 1 }))`. 5 minutes per language.
8. **Crash isolation.** A bad model still aborts the whole bun process (`SIGABRT` from native code, seen with the fp16 model). Mitigation: run TTS in a child process so one bad model only kills the worker. Important if this is ever deployed publicly.
9. **sid plumbing through HTTP / share APIs.** Currently sid is per-model server-side via `defaultSid`. If you ever want a separate "voice picker" UI alongside the model picker, you'd plumb sid through `/api/tts.wav` query string, the `shareContent` tRPC mutation, and the React reader state. Pre-existing design is described in earlier chat history.

## Decision log

Chronological record of what we tried, what worked, what didn't, and why. Reading this top-to-bottom shows how the design landed where it did.

### 1. Upgrade sherpa-onnx 1.10.0 → 1.13.2

Pinned at 1.10.0 from June 2024. Latest 1.13.2 was released a week before this session (May 2026), still on the 1.x line so semver-compatible with our `^1.10.0` range. All APIs we use (`OfflineTts({ model: { vits, ... } })`, `tts.generate`, `writeWave`) are intact; 1.13.2 adds support for newer model families (Matcha, Kokoro, Kitten, Zipvoice, Supertonic) and `generateAsync` with streaming progress callbacks.

Verified by extracting the 1.13.2 tarball and confirming the legacy generate path is preserved. Bumped to `^1.13.2`, smoke-tested with the existing alma model. No regressions.

### 2. Pivot: fp16 models crash on CPU

User picked `vits-piper-sv_SE-alma-medium-fp16` to test. Native exception: `Type Error: Type (tensor(float16)) of output arg ... does not match expected type (tensor(float))`. The fp16 variants are intended for GPU/DML inference; on CPU they reliably crash and abort the bun process via `SIGABRT`.

**Follow-up still outstanding (see "What's left" #8):** filter fp16 from the list when running on CPU, or isolate TTS in a child process.

### 3. Add yeager Piper Swedish voices (axel + daniel)

Goal: more Swedish voices. Yeager (Daniel Nylander) maintains `yeager/piper-voices-sv` with `axel`, `daniel`, and `alma` — alma matches k2-fsa's bundle. Two new candidates.

Problem discovered: yeager ships **raw Piper bundles** (`.onnx` + `.onnx.json` only, no `tokens.txt`, no `espeak-ng-data`, no sherpa-onnx metadata in the ONNX). Sherpa-onnx hard-fails on missing `sample_rate` metadata.

Solution implemented:
- New `server/lib/customModels.ts` registers third-party models with `postProcess` strategy, `innerPath` (for nested archives), and `piperFallback` defaults.
- New `server/lib/convertPiperModel.ts` does pure-JS conversion at download time: generates `tokens.txt` from `phoneme_id_map`, injects sherpa metadata into the ONNX (protobuf `metadata_props` append at end-of-file — relies on protobuf's concat-as-merge semantics), and copies `espeak-ng-data` from any sibling Piper voice into a shared `MODELS_DIR/_espeak-ng-data/`.
- Daniel's archive is even more incomplete (single `.onnx`, no JSON, no nested dir) — handled via `piperFallback` + `findSiblingTokensTxt` borrowing from another Piper voice. Safe because same-language Piper voices share identical `phoneme_id_map` (verified byte-equal between axel and alma).

End-to-end verified for both. Axel works at ~163ms/sentence; sounds lower-quality than alma (NST corpus is genuinely noisier).

### 4. Daniel removed

User listened: daniel sounded like radio noise. Investigated:
- `onnxruntime-node` direct inference showed daniel.onnx has **4 inputs vs alma's 3** — extra `sid` input → multi-speaker model.
- Binary-searched the speaker embedding range: 16 speakers.
- Probed all 16 sids via `scripts/probe-daniel-sids.ts` — all 16 produced noise.

Root cause was almost certainly the borrowed `tokens.txt`. Daniel was trained as a voice clone, likely with a different phoneme set than alma — our borrowed tokens were wrong, producing meaningless phoneme ids → noise regardless of sid. Without the (missing) `.onnx.json` from yeager, no way to recover the right tokens.

Removed daniel from `customModels.ts`. Kept the `convertPiperRawToSherpa` code — future Piper voices with complete bundles still benefit.

### 5. Add MMS-TTS Swedish (`vits-mms-sv`)

`willwade/mms-tts-multilingual-models-onnx/swe/` ships a pre-converted sherpa-onnx-compatible bundle for Meta's MMS-TTS Swedish. Single female voice, 16 kHz, character-level tokens (no espeak phonemizer needed). Loaded with the existing VITS path with no metadata injection.

New `CustomModel.rawFiles` field added to support bundles that ship as loose files rather than tarballs. `downloadModel` branches on `rawFiles` and downloads each file straight into the model dir.

User verdict: "good but sounds like an old audio file, low quality." Correct — 16 kHz is the model's design ceiling, not our integration. Kept in the picker as a different-character option with a `notes` field flagging the low fidelity + CC-BY-NC license.

### 6. Pivot: Kokoro plan considered and rejected

A separate plan (`plans/kokoro-tts-and-speaker-selection.md`) proposed adding Kokoro for quality + plumbing `sid` through the picker / HTTP / tRPC stack. Discarded after confirming Kokoro has **no Swedish voices** (per upstream `VOICES.md`: en, ja, zh, es, fr, hi, it, pt-BR — 9 languages, no sv).

Plan file deleted. The universally valuable idea from it (sid plumbing) was deferred — instead implemented a smaller server-side-only `CustomModel.defaultSid` mechanism that solves the immediate need (multi-speaker bundles) without the cross-cutting frontend work.

### 7. Add Supertonic 3 multilingual

The only remaining path to higher-than-Piper quality for Swedish (also commercial-OK via OpenRAIL-M license). 44.1 kHz output, ~123 MB download, supported by sherpa-onnx 1.13.2.

Required new model-family infrastructure in `tts.ts`:
- `detectFamily(files)` — returns `'vits' | 'supertonic'` based on `tts.json` + `unicode_indexer.bin` presence.
- `createVitsTTS(baseDir, files)` and `createSupertonicTTS(baseDir, files)` — family-specific config builders. Supertonic has 4 separate ONNX files + `tts.json` + `unicode_indexer.bin` + `voice.bin`.
- `generateSpeech` branches on family: VITS keeps the existing flat `tts.generate({ text, sid, speed, ... })`; Supertonic uses `new sherpa_onnx.GenerationConfig({ sid, speed, extra: { lang } })` and `tts.generate({ text, generationConfig })`.
- In-memory cache changed from `{ [name]: tts }` to `{ [name]: { tts, family } }` so the generate path knows which API to call.

Trade-offs:
- Generation latency ~15× slower than Piper (2.5s vs 160ms per sentence). Reader's existing 3-sentence prefetch absorbs this for sequential playback; the IndexPage's one-shot generation feels slower.
- Single voice style (`voice.bin`) shipped in the k2-fsa tarball.

User verdict: "awesome quality with supertonic sample :) love it".

### 8. Expose all 10 Supertonic voice styles via alias mechanism

Probed via `scripts/probe-supertonic-sids.ts`: sids 0..9 produce 10 distinct voices from the single bundled `voice.bin`. User confirmed all 10 sound good and distinct.

Added `CustomModel.aliasOf?: string`. An alias entry doesn't download anything — it shares the source model's directory and `OfflineTts` instance, only overriding `defaultSid`. Result: 9 new alias entries `supertonic-3-sv-int8-v1` through `-v9`, zero extra disk, one TTS instance in memory.

Implementation details:
- `downloadModel(aliasName)` recurses on `aliasOf` and delegates download to the source.
- New `resolveSourceModelName()` in `tts.ts` maps alias → source for the cache lookup.
- Audio cache already includes `sid` in the hash key — no collisions across aliases.

### 9. Expose all 31 Supertonic languages via the same alias mechanism

User: "let's add support for all languages." Supertonic 3 supports 31 languages from the same bundle; only `extra.lang` at generation time picks the language.

Added `CustomModel.defaultLang?: string` and made `tts.ts generateSentence` read it (`custom?.defaultLang ?? 'sv'` — the fallback preserves existing audio cache). Added 30 new alias entries via `['en', 'ko', ...].map(lang => ({ ..., aliasOf: 'supertonic-3-sv-int8', defaultLang: lang, defaultSid: 0 }))`.

Zero frontend changes: the existing language filter pattern (`-{code}-` / `-{code}_` in `Form.tsx` / `SpeakerModal.tsx`) already matches the new naming, and the existing `languageList` already contains all 31 ISO codes.

End-to-end verified with EN/DE/FR producing distinct WAVs from the same English input. (Side note: feeding English text to the German model produces English-with-a-German-accent — TTS isn't translation; the right pattern is to match the model's `lang` to the language of your input text.)
