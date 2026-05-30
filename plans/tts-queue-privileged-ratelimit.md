# TTS generation queue + privileged rate limit

**Status:** in-progress
**Created:** 2026-05-30
**Worktree:** /home/bahman/github/text-to-speech-worktree-tts-queue (branch: orchestrator/tts-queue-privileged-ratelimit)
**Integration target:** main
**Owner:** orchestrator agent

## Goal

Two backend improvements: (1) a concurrency-limited, deduplicating queue around TTS
generation so identical in-flight requests share one generation and total concurrency
is capped; (2) privileged clients (API_KEY / ALLOWED_IPS) get a separate generous rate
limiter instead of bypassing rate limiting entirely.

## Context & constraints

- Runtime: Bun. Gate: `bun run build` (= tsc typecheck + vite build). No test runner. Lint
  has pre-existing failures (per CLAUDE.md) so not used as gate here.
- No new npm packages. Keep all existing env defaults unchanged. No frontend edits.
- Files: server/env.ts, server/lib/tts.ts, server/index.ts.
- `generateSentence` already computes `hash` (object-hash) — dedup keys off that.
- `generateSpeech(entry, text, filePath, speed, steps, voiceStyle, lang)` is the call to wrap.
- `isPrivileged(req)` already exists in server/index.ts; `ttsRateLimit` currently has
  `skip: (req) => isPrivileged(req)`. trpcRateLimit's skip is left alone.

## Tasks

- [x] T1 — env.ts: add MAX_CONCURRENT_GENERATIONS, PRIVILEGED_TTS_RATE_LIMIT_MAX, PRIVILEGED_TTS_RATE_LIMIT_WINDOW_MS · _agent: self_
- [x] T2 — tts.ts: Semaphore + dedup map around generateSpeech in generateSentence · _agent: self_
- [x] T3 — index.ts: privilegedTtsRateLimit + dispatcher, drop skip from ttsRateLimit · _agent: self_
- [x] T4 — run `bun run build`, fix any new TS errors · _agent: self_
- [ ] T5 — commit, merge to main, cleanup worktree · _agent: self_

## Decisions

- 2026-05-30 — Worktree placed outside repo because `.claude/` and `plans/` are not gitignored;
  avoids polluting the user's main checkout. (plans/ is committed normally though.)
- 2026-05-30 — Single global Semaphore (TTS is CPU-bound), dedup keyed by file hash, per spec.

## Open questions (resolved internally)

- Dedup map value type: store `Promise<void>` for the in-flight generateSpeech (cache-miss path
  only). Cached hits return before reaching the queue, so dedup only wraps actual generation.

## Log

- 2026-05-30 — Plan created; worktree set up.
- 2026-05-30 — T1–T3 implemented across env.ts, tts.ts, index.ts.
- 2026-05-30 — T4: `bun run build` passed (tsc typecheck clean + vite build OK). node_modules
  symlinked from main checkout for the typecheck, then removed (gitignored anyway).
