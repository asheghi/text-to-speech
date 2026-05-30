# Security & abuse-prevention fixes

**Status:** in-progress
**Created:** 2026-05-30
**Worktree:** .claude/worktrees/security-abuse-fixes (branch: orchestrator/security-abuse-fixes)
**Integration target:** main
**Owner:** orchestrator agent

## Goal

Harden the TTS backend against abuse and a path-traversal vulnerability. Four fixes:
path-traversal validation on `getSharedContent`, rate-limiting on `/api/trpc`,
input caps on `shareContent`, and a periodic cleanup job for stale share/audio files.
Success: server starts cleanly, normal usage (load, TTS, share) still works, build passes.

## Context & constraints

- Runtime: **Bun** (Node-compatible APIs). Backend: `PORT=3122 bun run dev:server`. Frontend: `bun run dev` (port 3000, proxies `/api` to 3122).
- Rate limiting already uses `express-rate-limit` (`server/index.ts`, `ttsRateLimit`). Reuse it.
- Env validation: Zod in `server/env.ts`. Add new vars there.
- tRPC procedures: `server/routers/ttsRouter.ts`, registered via `server/router.ts`.
- Shares live in `data/shared/<nanoid>.json`; audio cache in `env.AUDIO_DIR` (`data/audio`). `nanoid` ids use alphabet `[A-Za-z0-9_-]`.
- Gate: `bun run build` (tsc typecheck + vite build). `bun run lint` has PRE-EXISTING failures (lexikon.ts, trpc.ts, ReaderPage.tsx, useAudioPlayer.ts) — must not add NEW ones.
- Global rule: NO AI/Claude attribution in commits.

## Tasks

- [x] T1 — Add path-traversal validation to `getSharedContent` (nanoid regex, NOT_FOUND on mismatch) · _agent: self_
- [x] T2 — Add tRPC rate-limit env vars to `server/env.ts` (TRPC_RATE_LIMIT_MAX, TRPC_RATE_LIMIT_WINDOW_MS) · _agent: self_
- [x] T3 — Apply separate rate-limit middleware to `/api/trpc` in `server/index.ts` · _agent: self_
- [x] T4 — Cap `content` (.max 100000) + validate speed/steps/voiceStyle in `shareContent` input schema · _agent: self_
- [x] T5 — Add periodic cleanup job (startup + 24h interval): shares >30d, audio >7d, with logging · _agent: self_
- [x] T6 — Run gate (build), verify server boots with PORT=3122 · _agent: self_
- [x] T7 — Web verification (load, real TTS, share roundtrip) — done via HTTP probes (web-tester agent not spawnable from sub-agent) · _agent: self_

## Decisions

- 2026-05-30 — Doing edits inline (self) rather than delegating: changes are small, well-specified, and tightly interrelated across 3 files. Cheaper and lower-risk than briefing sub-agents.

## Open questions (resolved internally)

- Cleanup job location: new `server/lib/cleanup.ts` module, invoked from `server/index.ts` on startup. Keeps `index.ts` lean and testable.
- TRPC rate limit default: 30 req / 15 min per IP (per spec). Privileged IPs/API key skip it (reuse `isPrivileged`).
- getSharedContent rejection: throw `TRPCError` with code `NOT_FOUND` (spec requires NOT_FOUND, not generic Error).

## Log

- 2026-05-30 — Plan created. Project intake done: clean tree, target=main, gate=`bun run build`.
- 2026-05-30 — Implemented T1–T5: nanoid regex + TRPCError NOT_FOUND in getSharedContent; TRPC_RATE_LIMIT env vars; trpcRateLimit middleware on /api/trpc; shareContent input caps (content<=100000, speed 0.1–5, steps 2–16, voiceStyle [MF][1-5]); new server/lib/cleanup.ts wired into startup.
- 2026-05-30 — Gate passed: `bun run build` (tsc typecheck + vite build) green. Server boots on PORT=3199, cleanup logs at startup. Probed API: traversal -> NOT_FOUND, oversized content -> BAD_REQUEST/too_big. T6 done.
- 2026-05-30 — Made vite proxy target + dev port env-configurable (VITE_API_PROXY_TARGET, VITE_DEV_PORT) to run an isolated dev pair alongside another session occupying 3000/3122. Backwards-compatible defaults (3000, localhost:3122) unchanged.
- 2026-05-30 — Web verification PASS via isolated dev pair (frontend 3010 -> backend 3133, MODELS_DIR/AUDIO_DIR pointed at main checkout's data). Results: GET / -> 200; getModelsList -> 665 models; real TTS (kitten-nano model) -> 200 + 165KB valid WAV; shareContent wrote id, getSharedContent restored all fields, /reader/:id -> 200; invalid voiceStyle 'Z9' -> BAD_REQUEST. No regressions. web-tester agent could not be spawned (running as sub-agent); verified by equivalent HTTP probes instead.
- 2026-05-30 — Dev servers stopped, node_modules symlink (temporary, gitignored) removed.
