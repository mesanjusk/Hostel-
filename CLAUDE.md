# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this is

**Pack with Me** — a move-in companion app for students in India: packing checklists, budgets,
hostel/PG/flat discovery, city guides, and communities. Anonymous-first: every visitor can use
most of the app without signing up.

## Repository layout

- The **git root is this directory (`Hostel-/`)**, not its parent. If your working directory
  is `C:\packwithme_claude`, that parent is *not* a git repo — run git from `Hostel-/`.
- `frontend/` — Vite + React 19 + TypeScript + Tailwind v4. Hand-built shadcn/ui-style
  primitives in `src/components/ui`, framer-motion, react-hook-form + zod. Path alias `@/` → `src/`.
- `backend/` — Node + Express + tsx, MongoDB via Mongoose, Zod validation.

## Commands

Run from the repo root (`Hostel-/`) unless noted.

| Task | Frontend | Backend |
|---|---|---|
| Dev server | `npm run dev --prefix frontend` (port 5173) | `npm run dev --prefix backend` (port 4000) |
| Typecheck | `npm run typecheck --prefix frontend` | `npm run typecheck --prefix backend` |
| Lint | `npm run lint --prefix frontend` | — |
| Build | `npm run build --prefix frontend` | `npm run build --prefix backend` |

- Frontend calls the backend at `import.meta.env.VITE_API_URL ?? "http://localhost:4000"`
  (see `frontend/src/lib/api.ts`). There is no Vite dev proxy — the fallback origin is used.
- Backend seed/migration/cleanup scripts live in `backend/scripts/` and are exposed as npm
  scripts (e.g. `npm run seed --prefix backend`, `npm run cleanup:duplicate-anonymous --prefix backend`).
- The in-app Browser pane starts servers from `.claude/launch.json` (names: `frontend`, `backend`).

## Architecture that isn't obvious from one file

- **Anonymous sessions.** Every visitor gets a `user` on first load via `POST /api/auth/anonymous`
  (`getOrCreateAnonymousUserByDeviceId`, keyed on a visitor/device id). So `user === null` means
  "bootstrap hasn't landed yet", *not* "logged out" — never redirect to login on null; recover in
  place (see `frontend/src/components/protected-route.tsx`). Linking a mobile number via OTP merges
  into the same account, preserving everything saved anonymously.
- **`role` is a permission, not a profile field.** `role` is `student` | `admin` (app permission).
  Profile attributes that merely *tailor* content (gender, city, college, and similar) are separate
  and must not be conflated with `role`.
- **Progressive profiling.** Identity and profile bits are collected lazily, not up front:
  `RequireIdentifiedRoute` (`protected-route.tsx`) gates the social surface (chat, community,
  find-a-roomie) behind a linked mobile number, and gender is collected via a popup on Home
  (`wa-login-home-view.tsx`) rather than a blocking form.
- **Nav is config-driven.** `frontend/src/features/nav/nav-items.ts` → `resolveNavLayout` →
  `useNavLayout()` → `dashboard-layout.tsx`. Home hub cards are a separate registry:
  `frontend/src/features/welcome/hub-widget-registry.ts` (`HUB_CARDS`), rendered by
  `wa-login-home-view.tsx`. New hub cards are **appended** (their default order is the array index;
  inserting mid-array collides with saved layout orders).
- **Communities auto-join** after onboarding/profile update via `ensureAutoJoinCommunities`
  (`services/communityService.ts`), using `ensureCommunity(type, scopeKey, …)` with a unique
  `{type, scopeKey}` index and an idempotent `joinCommunity`.
- Types/enums are **mirrored** between `backend/src/types.ts` and `frontend/src/types.ts` — change
  both. The backend serializes users through `backend/src/lib/serialize.ts`.

## Gotchas

- **Local dev MongoDB** (from backend `.env`): `mongodb://localhost:27017/Hostel?directConnection=true`
  — a safe local DB. `MONGODB_URI` is required; there is no hardcoded default.
- A one-off Node script that needs Mongoose must live in `backend/` (so `require("mongoose")`
  resolves), not a scratch dir. `Channel.communityId` is stored as an **ObjectId**, not a string —
  compare with `.toString()`.
- Adding a lazy route: register the `lazyRetry(() => import(...))` and the `<Route>` in
  `frontend/src/App.tsx`.

## Conventions

- Match the density and idiom of surrounding code; the codebase favors explanatory comments on
  non-obvious decisions (see the existing comments in `App.tsx`, `protected-route.tsx`, and
  `hub-widget-registry.ts` for the house style).
