# 14 — TypeScript Review

**Scope:** `backend/tsconfig.json`, `frontend/tsconfig.app.json`/`tsconfig.node.json`, and `any`/`unknown` usage across both projects.

## Compiler configuration

**Backend** (`backend/tsconfig.json`): `strict: true`, `esModuleInterop`, `forceConsistentCasingInFileNames`, path aliases (`@/*`) — a solid, modern strict configuration. Target ES2022, CommonJS module output (appropriate for the Node/Render deploy target), `tsc-alias` used post-build to resolve path aliases in emitted JS — correct setup for the `@/*` import pattern.

**Frontend** (`frontend/tsconfig.app.json`): `strict: true`, `noFallthroughCasesInSwitch: true` — good. However:

**F-TS-01 (Low)** — `frontend/tsconfig.app.json` sets `"noUnusedLocals": false` and `"noUnusedParameters": false` explicitly (rather than leaving them at their default). **Why it matters:** the project instead relies on ESLint's `@typescript-eslint/no-unused-vars` (set to `"warn"`, not `"error"`, in `frontend/eslint.config.js`) to catch unused locals/params — a warning-level lint rule is easy to ignore in a PR review and doesn't fail CI (especially since there is no CI at all — see `16-DevOps.md`). Enabling the stricter compiler options would catch this at typecheck time instead, where it can't be silently ignored.
**Solution:** enable `noUnusedLocals`/`noUnusedParameters` in the compiler config, or at minimum bump the ESLint rule to `"error"` once CI is in place to enforce it. Effort: 1 day.

## `any` / `unknown` usage

**Confirmed via grep across all of `frontend/src`:** `grep -rn ": any"` and `grep -rn "as any"` both return **zero matches**. This is an unusually strong result for a codebase of this size (~19k lines across `features/**/*.tsx` alone, 89 routed pages) and should be explicitly protected going forward — e.g. by setting `@typescript-eslint/no-explicit-any` to `"error"` in `eslint.config.js` (not currently set, meaning nothing currently *prevents* a future `any` from being introduced even though none exist today).

**F-TS-02 (Low)** — no equivalent grep was run against the backend in this pass; a follow-up check of `backend/src` for `: any`/`as any` is recommended to confirm the same discipline holds there, since the backend audit didn't specifically flag `any` usage as a positive or negative finding. Effort: 1 day (verification only).

## Type safety at runtime boundaries

**Positive:** Zod is used consistently on the backend to validate request bodies/queries at the HTTP boundary (`06-API.md` — ~29 of 34 route files have full Zod coverage), and on the frontend via `@hookform/resolvers` + Zod schemas for every form. This means the TypeScript type system's guarantees are backed by actual runtime validation at the two places types are least trustworthy (network boundaries) — a meaningfully more complete type-safety story than static types alone.

**F-TS-03 (Medium, cross-referenced)** — `backend/src/routes/products.routes.ts:9` casts `req.query.category as ProductCategory` with a bare type assertion instead of Zod validation (unlike the near-identical `places.routes.ts`, which validates the same shape of query properly). This is exactly the kind of gap that "no `any` usage" doesn't protect against — a type assertion (`as X`) bypasses the type checker's safety net just as thoroughly as `any` does, while being easy to miss in a grep for `any` specifically. Full detail in `06-API.md` F-API-05. Effort: 1 day.

## Type-sharing between frontend and backend

**F-TS-04 (Low, informational)** — there is no shared types package between `backend/` and `frontend/` — each side independently defines its own DTOs (e.g. `frontend/src/features/*/  *-dto.ts` files, ~30 of them) that must be manually kept in sync with the backend's actual response shapes. This is normal and expected for a two-deploy-target split with no monorepo tooling (see `02-Architecture.md`), but it is a source of silent drift risk: nothing prevents a backend response-shape change from going unnoticed by a frontend DTO until a runtime error occurs. Not urgent to fix given the project's current scale and two-person-or-small-team likely size, but worth revisiting if a `packages/shared-types` becomes viable alongside future monorepo tooling. Effort: 3 months (only worth doing alongside a larger monorepo-tooling investment, not standalone).

## Summary table

| # | Finding | Severity |
|---|---|---|
| F-TS-03 | Bare `as X` type assertion bypassing Zod validation (products.routes.ts) | Medium |
| F-TS-01 | noUnusedLocals/noUnusedParameters disabled, relies on warn-level lint only | Low |
| F-TS-02 | Backend not explicitly checked for any/as any (recommend follow-up) | Low |
| F-TS-04 | No shared types package between frontend/backend (informational) | Low |

**Rating: TypeScript 8/10.** Strict mode is on everywhere, `any` usage is genuinely absent from the frontend, and runtime validation (Zod) backs the static types at nearly every network boundary. The remaining gaps are narrow and specific rather than systemic.
