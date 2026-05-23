# Landing Page + Docs + Move app to /app

**Status:** done (merged into main)
**Created:** 2026-05-23
**Worktree:** .claude/worktrees/agent-af36042e0bf5c102a (branch: worktree-agent-af36042e0bf5c102a)
**Integration target:** main
**Owner:** orchestrator agent

## Goal

Replace the plain TTS form at `/` with a polished, modern landing page that markets the self-hostable TTS service. Move the existing form to `/app`. Add `/docs` with a clean developer API reference covering all HTTP and tRPC endpoints.

## Context & constraints

- Bun runtime; React + Vite + MUI Joy + Tailwind. Inter loaded via `@fontsource/inter`.
- Path aliases: `@/*` → `src/*`, `#/*` → `server/*`.
- Gate: `bun run build` (tsc + vite build) and `bun run lint --max-warnings 0`. Pre-existing lint issues exist (see CLAUDE.md) — must not add new ones.
- `RootLayout` is just `<Outlet />`; landing + docs will be standalone pages with their own minimal nav.
- tRPC procedures live in `server/routers/ttsRouter.ts`: `getModelsList`, `getStorageStatus`, `shareContent`, `getSharedContent`.
- HTTP TTS endpoints: `GET/PUT /api/tts`, `GET /api/tts.wav`; params `text`, `model`, `speed`, `steps`, `voiceStyle`.

## Tasks

- [x] T1 — Create `LandingPage.tsx` with hero/features/quick-start/footer
- [x] T2 — Create `DocsPage.tsx` with sidebar nav, HTTP API + tRPC API sections
- [x] T3 — Update `src/router.tsx` to wire new routes; move `IndexPage` to `/app`
- [x] T4 — Run `bun run build` and `bun run lint`; verify no new failures
- [x] T5 — Commit and merge into `main`
- [x] T6 — Push to `origin/main`

## Decisions

- 2026-05-23 — Inline both pages in single files (LandingPage.tsx, DocsPage.tsx) instead of decomposing into many small files; project keeps related UI together (see IndexPage components colocated in `components/`).
- 2026-05-23 — Used Tailwind exclusively for styling new pages (lighter dep surface than mixing with Joy), with optional Joy `Button` only if needed. Sticking with native + Tailwind keeps zero new deps and matches the "polished SaaS" look.

## Open questions (resolved internally)

- Should landing/docs be lazy-loaded? — No. The existing `router.tsx` has a comment "todo lazy loading pages" and nothing is lazy-loaded; matching existing pattern.
- Sidebar nav implementation in docs? — Anchor links + sticky aside, no state library. Simple.

## Log

- 2026-05-23 — Plan created.
- 2026-05-23 — Created `src/pages/landing/LandingPage.tsx` and `src/pages/docs/DocsPage.tsx` (both standalone, no RootLayout).
- 2026-05-23 — Rewrote `src/router.tsx`: `/` → LandingPage, `/docs` → DocsPage (both outside RootLayout). RootLayout now wraps `/app`, `/reader`, `/reader/:shareId`, `/status`.
- 2026-05-23 — Added `backLink="/"` to IndexPage so users can return to landing from `/app`.
- 2026-05-23 — `bun run build` passes (tsc + vite build). `bun run lint` shows only the 3 pre-existing errors + 4 pre-existing warnings documented in CLAUDE.md; no new lint issues introduced.
- 2026-05-23 — Pushed to `origin/main` (3 commits: feat, merge, plan update).
