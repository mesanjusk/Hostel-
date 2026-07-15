# 13 — Code Smells

Cross-cutting stylistic and structural issues not already fully covered as their own report section (those are cross-referenced rather than repeated).

## Long files / large handler files

**F-SMELL-01 (Low)** — `backend/src/routes/admin.routes.ts` is 617 lines / 45 handlers in one file. Not unmanageable, and the routes→service delegation keeps each handler short, but the ~150 lines of copy-pasted CRUD skeleton within it (`11-Duplicate-Code.md`) is the more actionable version of this smell than raw file length. Effort: bundled with `11-Duplicate-Code.md` F-DUP-01's backend counterpart.

## Copy-paste over abstraction

**F-SMELL-02 (Medium)** — Covered fully in `11-Duplicate-Code.md`: 9 near-identical admin form dialogs (frontend), ~8 near-identical CRUD blocks in `admin.routes.ts` (backend), duplicated `slugify()`/`escapeRegex()` implementations. This is the dominant code smell in the codebase — not dead code, not sloppy logic, but under-abstracted repetition that has already started to drift (see F-DUP-02).

## Magic numbers / hardcoded values

**F-SMELL-03 (Low)** — Spot-checked instances of hardcoded numeric/string literals that would benefit from named constants:
- `backend/src/index.ts:125` — `limit: 300` (rate limit ceiling) is a bare literal with no named constant or comment explaining why 300 was chosen versus another number.
- `backend/src/index.ts:108` — `limit: "10mb"` body size, and the mismatched `25_000_000` byte cap in `backend/src/validations/upload.ts:26` (already flagged as a functional bug in `04-Backend.md` F-BE-06) — a shared constant would have prevented the two values drifting out of sync with each other in the first place.
- `backend/src/services/otpService.ts` — cooldown/expiry windows (60s, 10 min, `MAX_VERIFY_ATTEMPTS`) are named constants already — a **good** counter-example showing the team knows this pattern; it's just not applied everywhere.
**Solution:** extract shared constants (e.g. a `config/limits.ts`) for cross-cutting values like body-size limits so they can't silently diverge across files. Effort: 1 day.

## Inconsistent error-code mapping

**F-SMELL-04 (Medium)** — Already detailed in `06-API.md` F-API-07: "not found" and "validation failure" business errors both collapse onto HTTP 400 across ~20 call sites in `admin.routes.ts` and `bag.routes.ts`, while `categories.routes.ts` and `bookings.routes.ts` correctly use 404/409. This is a code-smell in the sense that the *correct* pattern already exists in the same codebase but wasn't applied uniformly — a discoverability/consistency problem more than a knowledge gap.

## God-object-adjacent: FabMenu

**F-SMELL-05 (Low)** — `frontend/src/components/shared/fab-menu.tsx` statically imports and is responsible for mounting 7 distinct form dialogs (`03-Frontend.md` F-FE-01). Functionally this works, but architecturally it makes a "shared/global" component responsible for bundling nearly every feature's create-flow — a natural candidate to slim down alongside the eager-loading fix already recommended.

## Console-based debugging left as the only observability mechanism

**F-SMELL-06 (High, ties to `16-DevOps.md`)** — `console.log`/`console.error`/`console.warn` are the *only* logging mechanism in the backend (`04-Backend.md` F-BE-07), including for a documented "sensitive, auditable" admin action (`moderationService.ts:50`, F-BE-08). This is a code smell that's really a missing-infrastructure problem — see `16-DevOps.md` F-DEVOPS-07 for the fix.

## Positive findings (explicitly not smells)

- **Zero `: any`/`as any` usage anywhere in the frontend** (`14-TypeScript.md`) — a genuinely strong signal against type-related code smells.
- **No `eval`/`child_process`/dynamic-code-execution patterns anywhere in the backend.**
- **Consistent, convention-driven (if not type-enforced) response shapes** across ~195 backend route handlers (`04-Backend.md` F-BE-22) — the convention itself is a good one, just not compiler-enforced.
- **Self-pruning in-memory maps done correctly** in `lib/rateLimiter.ts` (`setInterval(...).unref()`), contrasted with two places that get it wrong (`eventService.ts`, `whatsapp.routes.ts`) — the good pattern already exists in the codebase as a template for the fix.

## Summary table

| # | Finding | Severity |
|---|---|---|
| F-SMELL-06 | console.* as the only logging/observability mechanism | High |
| F-SMELL-02 | Copy-paste over abstraction (admin dialogs, admin CRUD routes) | Medium |
| F-SMELL-04 | Inconsistent error-code mapping despite a correct pattern existing elsewhere | Medium |
| F-SMELL-01 | Large admin.routes.ts file (symptom of F-SMELL-02, not independently actionable) | Low |
| F-SMELL-03 | Magic numbers for cross-cutting limits (rate limit, body size) | Low |
| F-SMELL-05 | FabMenu as a quasi-god-component bundling 7 dialogs | Low |

**Rating: Code Smells 6.5/10.** No deeply entrenched anti-patterns were found — the issues here are all "the right pattern exists somewhere in this codebase but wasn't applied everywhere," which is a much easier class of problem to fix than systemic bad design.
