# Studio redesign: rename /app → /studio + dark theme

**Status:** in-progress
**Created:** 2026-05-23
**Worktree:** `.claude/worktrees/agent-a13130573bb013b1b` (branch: `worktree-agent-a13130573bb013b1b`)
**Integration target:** `main`
**Owner:** orchestrator agent

## Goal

Rename the TTS form page from `/app` to `/studio` and redesign it with a dark/gradient aesthetic matching the landing page. Standalone layout (no RootLayout wrapper). All TTS functionality (language/model selection, text input, Supertonic settings, Synthesize, Read) preserved exactly.

## Context & constraints

- React + Vite + MUI Joy + Tailwind, Bun runtime.
- Gate: `bun run build` (tsc + vite build) and `bun run lint --max-warnings 0`. Pre-existing lint issues exist in `server/seed/utils/lexikon.ts`, `server/trpc.ts`, `src/pages/reader/ReaderPage.tsx`, `src/pages/reader/hooks/useAudioPlayer.ts`.
- Path aliases: `@/*` → `src/*`, `#/*` → `server/*`.
- Landing palette to mirror: `bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900` with radial overlays; fuchsia-to-indigo accents.
- `react-select` Dropdown component supports `styles` prop for dark theming.
- No new dependencies allowed.

## Tasks

- [x] T1 — Update router: change path `app` → `studio`, move IndexPage to standalone route (out of RootLayout)
- [x] T2 — Update `LandingPage.tsx`: replace all 5 `/app` occurrences with `/studio`
- [x] T3 — Update `DocsPage.tsx`: replace all 3 `/app` occurrences with `/studio`
- [x] T4 — Redesign `IndexPage.tsx`: standalone dark layout, inline Nav header, drop Page wrapper
- [x] T5 — Redesign `Form.tsx`: dark theme styling, Supertonic panel restyled, MUI Joy dark variants
- [x] T6 — Update `Form.scss`: dark theme rules + react-select dark overrides
- [x] T7 — Adapt `Player.tsx` for dark theme
- [x] T8 — Run gate (`bun run build`, `bun run lint`) — gate passes; only pre-existing failures
- [x] T9 — Commit and merge to main

## Decisions

- 2026-05-23 — Keep file named `IndexPage.tsx` (rather than renaming to `StudioPage.tsx`) to minimize churn; only the route path changes. Component re-exported as before.
- 2026-05-23 — Use react-select `styles` prop with dark theme styles in `Dropdown.tsx` rather than overriding via global CSS — keeps changes scoped and avoids risk to other consumers.
- 2026-05-23 — Use MUI Joy's CSS variables for dark-mode overrides on inputs/buttons via inline `sx` props rather than wrapping with `CssVarsProvider` mode change — simpler, contained.
- 2026-05-23 — Player uses a styled audio bar (custom container, dark bg) instead of MUI components.

## Open questions (resolved internally)

- Q: Should the file be renamed to StudioPage.tsx? A: No, keep IndexPage filename — file rename adds noise to the diff and the component name is already an internal detail. Only the URL changes.
- Q: Use react-select Dropdown's `styles` prop or global SCSS for dark theming? A: Use `styles` prop. Other pages don't use this Dropdown in dark mode, and react-select's documented API for theming is the `styles` prop.

## Log

- 2026-05-23 — Plan created.
- 2026-05-23 — Router updated: `/studio` standalone, `/app` removed.
- 2026-05-23 — Replaced 5 `/app` links in LandingPage and 3 in DocsPage with `/studio`.
- 2026-05-23 — IndexPage rebuilt with dark gradient background, inline nav, centered card.
- 2026-05-23 — Form.tsx restyled with MUI Joy `sx` dark overrides; Supertonic panel uses slate-900/50 + slate-700 border.
- 2026-05-23 — Dropdown.tsx given react-select `styles` config for dark theme.
- 2026-05-23 — Player.tsx rewritten with dark container; Form.scss extended with audio dark color-scheme.
- 2026-05-23 — `bun run build`: PASS. `bun run lint`: 7 issues, all pre-existing (documented in CLAUDE.md); 0 new.
