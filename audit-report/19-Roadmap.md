# 19 — Final Roadmap: Top 100 Improvements

Sorted by impact (highest first within each effort-horizon band isn't strictly enforced — items are ordered by overall priority across the whole list). Effort estimates: **1 day**, **1 week**, **1 month**, **3 months**. Each item cross-references the report where its full rationale lives.

## Do immediately (this week) — process-crashing bugs, live security holes

1. Wrap all 34 route files' async handlers in an `asyncHandler`, or upgrade to Express 5 — `04-Backend.md` F-BE-02. **1 day.**
2. Add `process.on("unhandledRejection"/"uncaughtException")` backstop logging — `04-Backend.md` F-BE-02. **1 day.**
3. Fix predictable `pendingId` JWT-hijack in `/wa-register/status` (separate high-entropy polling token) — `07-Authentication.md` F-AUTH-07. **1 week.**
4. Add dedicated rate limit to `/wa-register/status` — `07-Authentication.md` F-AUTH-07. **1 day.**
5. Fail closed when `CORS_ORIGIN` is empty instead of allowing all origins — `04-Backend.md` F-BE-13. **1 day.**
6. Anchor the Vercel-preview CORS regex to the real team slug — `08-Security.md` F-SEC-01. **1 day.**
7. Map `null`/`deletedCount:0` to 404 on notes/contacts/documents/wishlist/budget/directory-contacts routes — `06-API.md` F-API-02. **1 day.**
8. Add startup-time zod validation of required env vars (`JWT_SECRET`, `MONGODB_URI`, `CORS_ORIGIN`, `IP_HASH_SALT`) — `04-Backend.md` F-BE-12. **1 day.**
9. Remove hardcoded fallback for `IP_HASH_SALT` — `04-Backend.md` F-BE-14. **1 day.**
10. Fix 10MB/25MB body-limit vs upload-schema mismatch — `04-Backend.md` F-BE-06. **1 day.**
11. Add DB-level limit to discovery `co-packers`/`roommates` queries — `06-API.md` F-API-03. **1 week.**
12. Add a daily per-mobile OTP-send cap independent of the 60s cooldown — `07-Authentication.md` F-AUTH-05. **1 week.**
13. Encrypt or stop persisting plaintext `waLoginPin` — `07-Authentication.md` F-AUTH-03. **1 week.**

## Week 2-4 — reliability, correctness, quick security wins

14. Add a 404 handler in `index.ts` — `04-Backend.md` F-BE-04. **1 day.**
15. Extract shared CORS-origin logic used by both REST and Socket.IO — `04-Backend.md` F-BE-05. **1 day.**
16. Add `SIGTERM`/`SIGINT` graceful shutdown (close HTTP server, Socket.IO, Mongo connection) — `16-DevOps.md` F-DEVOPS-05. **1 day.**
17. Make `/health` check actual MongoDB connectivity, return 503 on failure — `16-DevOps.md` F-DEVOPS-04. **1 day.**
18. Add `healthCheckPath` and missing Cloudinary/analytics env vars to `render.yaml` — `16-DevOps.md` F-DEVOPS-03. **1 day.**
19. Upgrade Render plan off free tier before real traffic — `16-DevOps.md` F-DEVOPS-03. **1 day (config + cost decision).**
20. Set explicit `maxPoolSize`/`serverSelectionTimeoutMS`/`socketTimeoutMS` on `mongoose.connect()` — `05-Database.md` F-DB-18. **1 day.**
21. Add compound index `{mobile,purpose,createdAt}` on `OtpVerification` — `05-Database.md` F-DB-02. **1 day.**
22. Prefix-anchor (or Atlas Search) the global user-search regex — `05-Database.md` F-DB-01. **1 week.**
23. Add pagination to `guide`, `products`, `places`, `directory-contacts` list endpoints — `06-API.md` F-API-04. **1 week.**
24. Add zod validation to `conversations.routes.ts` `/dm` and `communities.routes.ts` moderation PATCH — `06-API.md` F-API-05. **1 day.**
25. Make the chat message pin/unpin a `PUT` with explicit state instead of a POST toggle — `06-API.md` F-API-06. **1 day.**
26. Add explicit `algorithms:["HS256"]` to `jwt.verify` — `07-Authentication.md` F-AUTH-02. **1 day.**
27. Wrap `escapeRegex()` around admin search filters in `collegeCategoryService`/`courseService`/`defaultChecklistItemService` — `08-Security.md` F-SEC-05. **1 day.**
28. Add MIME allowlist + magic-byte check to chat file uploads — `04-Backend.md` F-BE-16 / `08-Security.md` F-SEC-06. **1 week.**
29. Clear `notifyTyping`'s timeout on unmount/scope change — `03-Frontend.md` F-FE-11. **1 day.**
30. Add `aria-label` to the unlabeled "More" button in `members-panel.tsx` — `03-Frontend.md` F-FE-09. **1 day.**
31. Add `loading="lazy" decoding="async"` to below-the-fold `<img>` tags — `03-Frontend.md` F-FE-08. **1 day.**
32. Bump service-worker `CACHE_NAME` per build / switch index.html to network-first — `03-Frontend.md` F-FE-02. **1 week.**
33. Make `DashboardLayout`/`FabMenu`'s 7 dialogs lazy — `03-Frontend.md` F-FE-01. **1 week.**
34. Memoize the `AuthContext` provider value — `03-Frontend.md` F-FE-10. **1 day.**
35. Delete unused `@radix-ui/react-tooltip` + `components/ui/tooltip.tsx` — `10-Dead-Code.md` F-DEAD-01 / `12-Unused-Packages.md` F-PKG-01. **1 day.**
36. Delete 9 orphaned sticker PNGs — `10-Dead-Code.md` F-DEAD-02. **1 day.**
37. Consolidate 4 duplicate `escapeRegex`/`slugify` implementations onto the shared `lib/` versions — `11-Duplicate-Code.md` F-DUP-02/F-DUP-03. **1 day.**
38. Un-export `classifyReferrer` (make it a private helper) — `10-Dead-Code.md` F-DEAD-03. **1 day.**
39. Parallelize the sequential onboarding community-join loop with `Promise.all` — `04-Backend.md` F-BE-10 / `05-Database.md` F-DB-08. **1 day.**
40. Cap `User.interests`/`blockedUserIds` array lengths in validation — `05-Database.md` F-DB-16. **1 day.**
41. Replace `conversationService`'s per-conversation `countDocuments` fan-out with one aggregation — `05-Database.md` F-DB-09. **1 week.**
42. Push `getBudgetSummary`'s in-Node `.reduce()` into a Mongo `$group` — `05-Database.md` F-DB-10. **1 week.**
43. Add a self-ticking `setInterval` prune to `eventService.ts`'s `onlineVisitors` map — `04-Backend.md` F-BE-19. **1 day.**
44. Add the same self-ticking prune to `whatsapp.routes.ts`'s in-memory session maps — `04-Backend.md` F-BE-20. **1 day.**
45. Drop the redundant standalone index on `Conversation.memberIds` — `05-Database.md` F-DB-04. **1 day.**
46. Add a compound index `{mobile,status,createdAt}` on `WaPendingRegistration` — `05-Database.md` F-DB-03. **1 day.**
47. Fix the `products.routes.ts` bare `as ProductCategory` type assertion with real zod validation — `14-TypeScript.md` F-TS-03 / `06-API.md` F-API-05. **1 day.**
48. Enable `noUnusedLocals`/`noUnusedParameters` in frontend tsconfig — `14-TypeScript.md` F-TS-01. **1 day.**
49. Set `@typescript-eslint/no-explicit-any` to `error` (locks in the current zero-`any` state) — `14-TypeScript.md`. **1 day.**
50. Add a minimal smoke-test suite: auth login/register, one CRUD round-trip per resource — `17-Best-Practices.md` F-BP-01. **1 week.**

## Month 1-2 — infrastructure foundation, structural refactors

51. Stand up a GitHub Actions CI workflow (typecheck + lint + build gate on PR) — `16-DevOps.md` F-DEVOPS-01. **1 week.**
52. Add Sentry error tracking to the backend — `16-DevOps.md` F-DEVOPS-07. **1 week.**
53. Replace `console.*` with structured logging (pino) + request-ID correlation — `04-Backend.md` F-BE-07 / `16-DevOps.md` F-DEVOPS-07. **1 week.**
54. Introduce Redis and move Socket.IO to `@socket.io/redis-adapter` — `15-Scalability.md`. **1 month.**
55. Move `onlineUsers` presence tracking to Redis — `04-Backend.md` F-BE-18. **1 month (with #54).**
56. Move both rate limiters (`express-rate-limit`, `lib/rateLimiter.ts`) to a Redis-backed store — `15-Scalability.md` / `08-Security.md` F-SEC-03. **1 week (with #54).**
57. Upgrade MongoDB Atlas to a dedicated tier (M10+) — `05-Database.md` / `15-Scalability.md`. **1 week (ops task).**
58. Add a durable `AdminAuditLog` for sensitive admin actions (starting with `traceAnonymousAuthor`) — `04-Backend.md` F-BE-08. **1 week.**
59. Add a centralized `AppError`/`HttpError` class hierarchy — `04-Backend.md` F-BE-09. **1 week.**
60. Standardize service-layer error codes (`NOT_FOUND`/`CONFLICT`/`VALIDATION`) mapped centrally to status codes — `06-API.md` F-API-07. **1 week.**
61. Add a `res.ok()`/`res.fail()` response helper to enforce the existing consistent convention — `04-Backend.md` F-BE-22. **1 week.**
62. Introduce `/api/v1` versioning prefix — `04-Backend.md` F-BE-21. **1 week.**
63. Extract a generic `useCrudFormDialog` hook and migrate the 9 admin form dialogs onto it — `03-Frontend.md` F-FE-07 / `11-Duplicate-Code.md` F-DUP-01. **1 month.**
64. Extract a generic admin-CRUD route factory and migrate `admin.routes.ts`'s ~8 duplicated blocks — `06-API.md` F-API-09 / `11-Duplicate-Code.md`. **1 month.**
65. Lift per-row dialog state to parent components on checklist/budget/notes/documents/contacts/wishlist views — `03-Frontend.md` F-FE-03. **1 month.**
66. Migrate JS-reduce analytics (`behaviorAnalyticsService`, `businessAnalyticsService`, `loginAnalyticsService`, `visitorAnalyticsService`) to native Mongo aggregation pipelines — `05-Database.md` F-DB-11/F-DB-12. **1 month.**
67. Replace `.distinct()` calls on `AnalyticsEvent` with `$group`+`$count` — `05-Database.md` F-DB-11. **1 week (part of #66).**
68. Add a short-TTL Redis cache for analytics/dashboard aggregations — `05-Database.md` F-DB-13. **1 week (with #54).**
69. Add manual Vite chunking for three.js, recharts, jspdf, react-moveable — `03-Frontend.md` F-FE-06. **1 week.**
70. Add a Dockerfile + `.dockerignore` for the backend — `16-DevOps.md` F-DEVOPS-02. **1 week.**
71. Introduce a BullMQ queue (on the new Redis) for WhatsApp OTP sends and webhook processing — `04-Backend.md` F-BE-17 / `15-Scalability.md`. **1 month.**
72. Move image/file uploads to direct-to-Cloudinary signed client uploads — `04-Backend.md` F-BE-15. **1 month.**
73. Add a `tokenVersion` field on `User`, embed in JWT, bump on PIN reset/role change/logout — `07-Authentication.md` F-AUTH-01. **1 week.**
74. Wrap `Community.memberCount` join/leave writes in a Mongo transaction (or compute at read time) — `05-Database.md` F-DB-14. **1 week.**
75. Migrate `bcryptjs` to native `bcrypt` or `argon2` for CPU efficiency at scale — `07-Authentication.md` F-AUTH-04. **1 week.**
76. Move JWT storage from `localStorage` to httpOnly cookies + CSRF protection — `07-Authentication.md` F-AUTH-08. **1 month.**
77. Track login-attempt rate limiting in-memory/Redis instead of a DB write per attempt — `04-Backend.md` F-BE-11. **1 week.**
78. Reconcile the `User.collegeCategory`/`collegeCategoryId` dual-write paths — `05-Database.md` F-DB-17. **1 week.**
79. Add an atomic upsert (or partial unique index) for `OtpVerification` resend race — `05-Database.md` F-DB-06. **1 week.**
80. Add array-length caps to `Message.attachments` and `DirectoryContact.reports` — `05-Database.md` F-DB-16. **1 day.**
81. Add connection-event logging (`mongoose.connection.on('error'/'disconnected')`) — `05-Database.md` F-DB-19. **1 day.**
82. Verify the `trust proxy` assumption against Render's actual LB behavior — `08-Security.md` F-SEC-04. **1 day (verification).**
83. Add basic OpenTelemetry/Prometheus metrics export — `16-DevOps.md` F-DEVOPS-07. **1 month.**

## Month 2-3+ — scale-out, coverage, polish

84. Build out a real backend test suite (Supertest + mongodb-memory-server) covering auth, checklist, budget, bookings — `17-Best-Practices.md` F-BP-01. **3 months.**
85. Build out frontend component tests (Vitest + RTL) for the consolidated form-dialog component — `17-Best-Practices.md` F-BP-01. **3 months (after #63).**
86. Gate CI on the new test suite; add branch protection requiring CI + review — `16-DevOps.md` / `17-Best-Practices.md`. **1 week (once tests exist).**
87. Move to horizontally-scaled multiple Render instances once #54-57 land — `15-Scalability.md`. **1 month.**
88. Evaluate MongoDB read replicas (`secondaryPreferred`) for analytics/dashboard reads — `05-Database.md` / `15-Scalability.md`. **1 month.**
89. Add an OpenAPI/Swagger spec for the API surface — `17-Best-Practices.md` F-BP-02. **1 month.**
90. Write a `CONTRIBUTING.md` and document the routes→services→models convention explicitly — `17-Best-Practices.md` F-BP-02. **1 week.**
91. Add compression/WebP conversion for the 43 sticker PNGs — `03-Frontend.md` F-FE-12. **1 day.**
92. Extract a shared "taxonomy CRUD" base for `courseService`/`collegeCategoryService` — `11-Duplicate-Code.md`. **1 week.**
93. Standardize the pagination response envelope (`{data,total,page,pageSize}`) across all list endpoints — `06-API.md` F-API-08. **1 week.**
94. Switch creates to return `201` instead of bare `200` — `06-API.md` F-API-08. **1 week.**
95. Add a shared `useAsyncEffect`/AbortController helper and apply it to the ~50 id-keyed fetch effects missing cancellation — `03-Frontend.md` F-FE-04. **1 month.**
96. Migrate frontend data fetching to TanStack Query for scoped cache invalidation — `03-Frontend.md` F-FE-05. **1 month.**
97. Add a bundle-size visualizer (`rollup-plugin-visualizer`) to the build pipeline and track over time — `03-Frontend.md` F-FE-06. **1 day.**
98. Evaluate database sharding strategy (shard-key decision) ahead of very large data volume — `05-Database.md` / `15-Scalability.md`. **3 months (evaluation only, not implementation).**
99. Add container orchestration readiness (K8s manifests or ECS task defs) once Dockerized — `16-DevOps.md` F-DEVOPS-02. **3 months.**
100. Full multi-region / multi-provider deployment evaluation once all of the above land — `15-Scalability.md`. **3 months.**

## Effort distribution

| Horizon | Count |
|---|---|
| 1 day | 34 |
| 1 week | 42 |
| 1 month | 20 |
| 3 months | 4 |

**Recommended sequencing:** items 1-13 should ship this week regardless of any other priority — they are live bugs and security holes, not scale preparation. Items 14-50 form a solid one-month sprint that meaningfully improves reliability and closes the biggest correctness gaps. Items 51-83 are the infrastructure investment (Redis, CI/CD, observability, containerization) that unlocks the 10K→1M scaling path. Items 84-100 are the sustained, multi-month investments (test coverage, full horizontal scale-out, multi-region readiness) that turn "can technically handle 1M users" into "operates confidently at 1M users."
