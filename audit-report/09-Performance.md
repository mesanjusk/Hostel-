# 09 — Performance Review

**Scope:** synthesizes performance-relevant findings from the backend, database, and frontend research into one cross-cutting view. Individual findings are cross-referenced to their full write-up in the respective report.

## Backend/API performance

| Finding | Severity | Detail |
|---|---|---|
| Discovery endpoints (`co-packers`/`roommates`) fetch full candidate sets and filter in-memory, no DB-level limit | Critical | `06-API.md` F-API-03 |
| `.distinct()` on `AnalyticsEvent` can hard-fail at MongoDB's 16MB result cap | Critical | `05-Database.md` F-DB-11 |
| Non-anchored regex user search = full collection scan on every keystroke | Critical | `05-Database.md` F-DB-01 |
| Guide/products/places/directory-contacts lists are unbounded (no pagination) | High | `06-API.md` F-API-04 |
| Raw analytics event rows pulled into Node instead of aggregated in Mongo | High | `05-Database.md` F-DB-12 |
| Sequential N+1 round trips in community auto-join (onboarding) | High | `05-Database.md` F-DB-08 |
| N+1 unread-count queries per conversation (up to 100 per inbox load) | High | `05-Database.md` F-DB-09 |
| No connection-pool/timeout tuning on `mongoose.connect()` | Medium-High | `05-Database.md` F-DB-18 |
| No caching layer for repeated analytics aggregations | Medium | `05-Database.md` F-DB-13 |
| Global 10MB JSON body limit applied to every route, including tiny ones | High | `04-Backend.md` F-BE-06 |
| Uploads buffered fully in memory as base64 (up to ~33MB per concurrent upload) | High | `04-Backend.md` F-BE-15 |
| Per-user list services (budget, notes, documents) have no `.limit()`, sums computed in Node | Medium | `05-Database.md` F-DB-10 |

**Why this cluster matters most:** the discovery endpoint and the analytics `.distinct()` calls are the two findings most likely to cause outright failures (timeouts, OOM, or hard 16MB-limit errors) rather than gradual slowdowns — they should be prioritized over pure latency-optimization work.

## Frontend performance

| Finding | Severity | Detail |
|---|---|---|
| Service worker cache-first on hashed assets — broken sessions after every deploy | High | `03-Frontend.md` F-FE-02 |
| DashboardLayout + 7 form dialogs statically bundled into the eager/login-page chunk | High | `03-Frontend.md` F-FE-01 |
| Per-row Dialog + react-hook-form mounting on unbounded per-user lists (checklist, budget, etc.) | High | `03-Frontend.md` F-FE-03 |
| No manual chunking for heavy libs (three.js, recharts, jspdf, react-moveable) | Medium | `03-Frontend.md` F-FE-06 |
| Most images eager-loaded, no `loading="lazy"` | Medium | `03-Frontend.md` F-FE-08 |
| Ad hoc whole-cache invalidation on every mutation instead of scoped invalidation | Medium | `03-Frontend.md` F-FE-05 |

**Positive:** route-level code splitting is already correctly implemented app-wide (`App.tsx`), and PDF/lottie/recharts are already dynamically imported in most places — the frontend's performance debt is concentrated in a few specific spots (the FAB menu's eager dialogs, the service worker, and per-row dialog mounting), not systemic.

## Blocking / synchronous operations

- `otpService.ts:41-47` blocks the HTTP request on the outbound WhatsApp Graph API call before responding (`04-Backend.md` F-BE-17) — no queue exists to offload this.
- `authService.ts:41-57` writes to the User document synchronously on every login attempt, including failures (`04-Backend.md` F-BE-11).
- Analytics services compute aggregations via JS `.reduce()` over raw `find()` results rather than Mongo's aggregation engine (`05-Database.md` F-DB-12) — CPU-bound work happening in the API process instead of the database.

## Missing caching / compression / CDN

- **No Redis or any cache layer anywhere** in the backend (confirmed by grep) — repeated expensive queries (analytics, dashboard) recompute from scratch on every request.
- **Compression is present**: `compression()` middleware is correctly applied in `index.ts:60` for all JSON responses — a genuine positive, cuts payload size for the mobile-heavy audience this app targets.
- **CDN**: Vercel's edge network automatically handles static-asset caching/compression for the frontend (`16-DevOps.md` F-DEVOPS-08) — no action needed there. Cloudinary similarly provides CDN delivery for uploaded images — a correct architectural choice already in place.
- **Object storage**: Cloudinary usage itself is sound; the performance issue is entirely in how files reach Cloudinary (buffered base64 through the Express process — see F-BE-15), not in Cloudinary's own delivery.

## Rating

**Performance: 4.5/10.** The building blocks that are hardest to retrofit later — compression, CDN-backed object storage, route-level code splitting — are already done correctly. The score is held down by several endpoints and code paths that will fail outright (not just slow down) well before 1M users: the discovery endpoint's unbounded in-memory filter, the `.distinct()` calls' 16MB ceiling, and the non-anchored regex search. These are the highest-priority performance fixes in the roadmap.
