# 02 — Architecture Review

**Scope:** overall repository structure, layer separation, dependency flow, module boundaries, naming consistency, monorepo quality, frontend/backend separation.

## Folder structure & project organization

The repo is a two-project layout, not a true monorepo (no shared workspace tooling — no npm/pnpm workspaces, no Turborepo/Nx, no shared `packages/` directory):

```
backend/    Express + TypeScript + Mongoose REST API — deploy to Render
frontend/   Vite + React + TypeScript SPA — deploy to Vercel
```

Each has its own independent `package.json`, `tsconfig.json`, and lockfile, and communicates only over HTTP/CORS + a JWT bearer token — there is no shared server runtime. This is a reasonable, simple choice for a two-service app and avoids monorepo tooling overhead the project doesn't yet need.

**Backend internal structure** (`backend/src/{routes,services,models,validations,middleware,lib}`) follows a clean, conventional layered architecture:
- `routes/` — Express routers, one per feature domain (38 files)
- `services/` — the designated data-access layer, the only place that talks to Mongoose models (47 files)
- `models/` — Mongoose schemas (34 files)
- `validations/` — Zod request-body schemas (21 files)
- `middleware/` — `requireAuth`/`requireAdmin`/`optionalAuth`, analytics context
- `lib/` — cross-cutting utilities (JWT, phone normalization, PIN hashing, rate limiting, etc.)

This layering is **real, not aspirational** — `admin.routes.ts` (617 lines, 45 handlers) never touches a Mongoose model directly, delegating entirely to ~15 services (confirmed in `04-Backend.md`). Two minor exceptions exist (`users.routes.ts`, `chat.routes.ts` import models directly — `04-Backend.md` F-BE-01), but this is the exception, not the pattern.

**Frontend internal structure** (`frontend/src/{pages,features,components,context,lib,layouts}`) is feature-organized rather than type-organized, which is the right choice at this scale:
- `pages/` — one thin file per route, wrapping a `features/` view
- `features/` — one folder per vertical (auth, bags, budget, checklist, chat, community, discovery, etc.) — 22 feature folders, ~123 files
- `components/ui/` — hand-built shadcn/ui-style primitives
- `components/shared/` — cross-feature UI (navbar, sidebar, bottom nav, FAB)
- `context/` — auth context (JWT + current user)
- `lib/` — API client and utilities

## Dependency flow

**Backend:** `routes → services → models`, with `lib/` and `middleware/` as cross-cutting concerns consumed by both — a clean, mostly-unidirectional dependency flow. No circular dependency was found in the researched files (mongoose models don't import services; services don't import routes).

**Frontend:** `pages → features → components/lib` — also clean and unidirectional. `App.tsx` correctly lazy-loads all page components (`03-Frontend.md` — this was a specific hypothesis in the audit brief that turned out to be false; route splitting is already done right).

**Cross-project:** frontend never imports backend code or vice versa (expected, given the two-deploy-target split) — the only shared logic is intentionally-duplicated utility code (`lib/phone.ts` exists near-identically in both, confirmed byte-for-byte identical with no drift — `11-Duplicate-Code.md`).

## Module boundaries & naming consistency

**F-ARCH-01 (Low)** — Backend route paths are inconsistently pluralized (`/api/bags` vs `/api/wishlist` vs `/api/budget`) and there's a filename/URL-casing split (camelCase `.ts` filenames like `waRegister.routes.ts`/`directoryContacts.routes.ts` mounted at kebab-case paths `/api/wa-register`/`/api/directory-contacts`). This split is at least applied as a **consistent rule** throughout (all camelCase files map to kebab-case paths), so it's a Low-severity developer-experience nit rather than a real inconsistency. Full detail in `06-API.md` F-API-11.

**F-ARCH-02 (Medium)** — No API versioning (`/api/v1`) anywhere — all 27 route groups mount directly under `/api/*`. This is a structural/architectural gap: there's currently no seam for introducing a breaking change without either breaking every client simultaneously or maintaining awkward parallel fields forever. Full detail in `04-Backend.md` F-BE-21.

## Circular dependencies

No circular import was found in either project during the research phase (backend: models never import services/routes; frontend: features never import pages, components/ui never imports features). This is a genuine strength — nothing to remediate here.

## Monorepo tooling

There is no monorepo tooling (no workspaces, no Turborepo/Nx, no shared lint/tsconfig base). **This is appropriate at the current two-project scale** — introducing workspace tooling now would be premature complexity. It becomes worth revisiting only if a third deployable (e.g. a shared types package, a mobile app, an admin-only app) is added.

## Frontend/backend separation

Clean and correctly enforced: authentication is stateless (JWT bearer token, no server-side session store shared between requests beyond the DB-backed user lookup), CORS is the only coupling mechanism, and there's no shared build/runtime. This separation is what makes the two projects independently deployable to Render and Vercel respectively, which the architecture correctly exploits.

## Architecture rating: 7.5/10

**Strengths:** clean, real (not aspirational) layered architecture on the backend; feature-based organization on the frontend; no circular dependencies; correct statelessness for horizontal scaling in principle; sensible two-project split without premature monorepo tooling.

**Weaknesses:** no API versioning strategy; some route-naming inconsistency; the architecture's stated statelessness is undermined in practice by in-memory Socket.IO state and in-memory rate limiters (see `15-Scalability.md`) — the *code organization* is sound, but a few specific implementation choices don't yet honor the horizontal-scaling implications of that organization.
