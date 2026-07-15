# 04 — Backend Review

**Scope:** `backend/src/index.ts`, all of `middleware/`, `lib/`, `services/` (35 files), `db.ts`, `types.ts`, representative `routes/*.ts`, `scripts/*.ts`, `package.json`. Express `^4.21.1`, Node v22, TypeScript strict mode on.

## 1. Architecture / layering

The routes → services → models layering (documented in root `README.md:139-160`) is real and mostly honored: `admin.routes.ts` (617 lines, 45 handlers) never touches a Mongoose model directly and delegates to ~15 services — a genuinely clean split worth preserving.

**F-BE-01 (Low)** — `backend/src/routes/users.routes.ts:5,35` and `backend/src/routes/chat.routes.ts:17,143` import Mongoose models (`User`, `Message`) directly instead of going through a service, breaking the layering in just these two files. **Why:** business/authorization logic for those queries can drift from the equivalent logic centralized elsewhere. **Fix:** move the two queries into `userService`/`chatService`. Effort: 1 day.

## 2. Middleware (`index.ts`)

**F-BE-02 (Critical)** — `backend/src/index.ts:168-171` (the global error handler) is unreachable for the overwhelming majority of errors. Express 4 does not forward rejected promises from `async` handlers to `next(err)` — that only ships in Express 5. Across `backend/src/routes`, **195** handlers are `async` with **zero** `asyncHandler`/`express-async-errors` wrapper and zero `next(err)` call sites. No `process.on("unhandledRejection", ...)` is registered anywhere. **Why it matters:** any thrown error inside an async handler (a Mongoose `CastError` from a malformed ObjectId is the single most common trigger, on essentially every `:id`-scoped route in the app) becomes an unhandled rejection, which by default **terminates the Node process** on Node ≥15 — a full outage for every connected user from routine bad input, not a contained per-request failure. **Fix:** upgrade to Express 5 (auto-forwards async rejections) or add a one-line `asyncHandler` wrapper applied to all 195 handlers, plus `process.on("unhandledRejection"/"uncaughtException", ...)` as a backstop. This is the single highest-priority fix in the whole audit. Effort: 1 day.

**F-BE-03 (High)** — `backend/src/routes/auth.routes.ts:55-62,97-104,156-163` catch specific errors and re-throw, clearly written assuming Express will route the rethrow to the central handler — it won't (see F-BE-02), and this is on the highest-traffic, first-impression endpoints (login/register/reset). Effort: bundled with F-BE-02.

**F-BE-04 (Medium)** — No 404 handler registered in `index.ts`. Unknown paths fall through to Express's default HTML 404 page — inconsistent for a JSON API and leaks Express's default error format. **Fix:** `app.use((req,res)=>res.status(404).json({error:"Not found"}))` before the error handler. Effort: 1 day.

**F-BE-05 (Medium)** — CORS allow-list logic (env parsing + Vercel-preview regex) is duplicated between `index.ts:71-100` (HTTP) and `lib/socket.ts:52-53` (Socket.IO). **Why:** the two will silently drift — a future change to one and not the other reopens or breaks CORS for only sockets or only REST. **Fix:** extract a shared `lib/cors.ts` helper used by both. Effort: 1 day.

**F-BE-06 (High)** — Global JSON body limit is `10mb` (`index.ts:106-113`) applied to *every* route, while `backend/src/validations/upload.ts:26` allows chat file uploads up to **25MB** — larger than the global parser limit, meaning that feature is currently unreachable (`express.json()` 413s before validation runs) — a live bug, not just a scale risk. **Fix:** small default limit (e.g. 256kb) globally, larger route-specific limit mounted only on `/api/uploads`. Effort: 1 day.

## 3. Error handling & logging

**F-BE-07 (High)** — Logging is exclusively `console.log`/`console.error`/`console.warn` — no structured logger (pino/winston), no log levels, no request-ID correlation. **Why it matters at 1M+ users:** unstructured stdout with no correlation ID makes it impossible to distinguish a routine 400 from a P0 outage in aggregate, or to trace one request's full lifecycle. **Fix:** pino with request-scoped child loggers. Effort: 1 week.

**F-BE-08 (Medium)** — `backend/src/services/moderationService.ts:50` — `traceAnonymousAuthor`, an admin action that de-anonymizes a message author and is explicitly commented as "a sensitive, auditable action," is audited only via `console.warn`. **Why:** not queryable, not tamper-evident, typically not retained long-term on PaaS logs — a compliance/forensics gap if an admin account is abused. **Fix:** write a durable `AdminAuditLog` document for this and other sensitive admin actions. Effort: 1 week.

**F-BE-09 (Medium)** — No centralized `AppError`/`HttpError` class. Ad hoc `instanceof` checks per route (`OtpCooldownError`, `RateLimitedError`, etc.); everything else collapses to a generic 500. **Fix:** one `AppError` class with `status`/`code`, thrown from services, branched on in the (now-reachable, per F-BE-02) global handler. Effort: 1 week.

## 4. Async patterns

**F-BE-10 (Medium)** — `backend/src/services/communityService.ts:181-196` (`ensureCommunitiesForUser`, runs on every onboarding/profile update) issues sequential awaited round-trips per global community and per interest instead of `Promise.all`. **Why:** onboarding is mandatory for every one of 1M+ users — cumulative round-trip count and p99 latency scale linearly with interest-list length. **Fix:** parallelize with `Promise.all`. Effort: 1 day.

**F-BE-11 (Low)** — `backend/src/services/authService.ts:41-57` (`recordAttempt`) does a synchronous `await user.save()` on **every** login attempt including failures, writing a trimmed timestamp array to the User document. **Why:** a credential-stuffing burst becomes a write-amplification vector. **Fix:** track in-memory/Redis, reserve DB writes for successful logins. Effort: 1 week.

**Positive:** `Promise.all` is used extensively and correctly for independent parallel reads across 30+ call sites (`checklistService`, `dashboardService`, `searchService`, `chatService`, analytics services) — this is a real strength.

## 5. Environment variables

**F-BE-12 (Critical)** — No startup-time validation of required env vars. `JWT_SECRET` (`lib/jwt.ts:3,7-9,14-16`) and `MONGODB_URI` (`db.ts:3,13-15`) are read lazily — the server can fully boot and pass health checks with `JWT_SECRET` unset, then every login/protected request throws at sign/verify time (compounding with F-BE-02's crash risk) instead of failing loudly at deploy time. **Fix:** a single zod-validated `env.ts` parsed once at process start, `process.exit(1)` on any missing required var before `app.listen`. Effort: 1 day.

**F-BE-13 (High)** — `backend/src/index.ts:71-89` — if `CORS_ORIGIN` is unset/empty, `allowedOrigins.length === 0` and the origin callback treats an **empty allow-list as "allow every origin"** (with `credentials: true`). **Why:** a missing env var silently degrades to the least secure state instead of failing closed. **Fix:** fail closed on empty `CORS_ORIGIN` in production. Effort: 1 day. (Cross-referenced in `08-Security.md`.)

**F-BE-14 (Medium)** — `backend/src/lib/geo.ts:6` — `IP_HASH_SALT` falls back to a hardcoded, git-committed string if the env var is unset, defeating the entire point of salting (an attacker with the known fallback salt and a target IP can confirm IP presence in analytics data). **Fix:** require this at boot, no silent default for privacy-relevant secrets. Effort: 1 day. (Cross-referenced in `08-Security.md`.)

## 6. File uploads

**F-BE-15 (High)** — Uploads are base64 data URIs inside the JSON body (no multer/streaming). The full file is buffered in memory up to three times (raw HTTP body, parsed base64 string ~33% larger than binary, Cloudinary SDK's own buffer). **Why:** a burst of concurrent uploads (e.g., students sharing move-in photos) can spike process memory and OOM-kill a single instance, taking every other in-flight request down with it. **Fix:** direct-to-Cloudinary signed uploads from the client, bypassing the backend for file bytes entirely. Effort: 1 week.

**F-BE-16 (Medium)** — `backend/src/services/uploadService.ts:25` — the attachment's MIME type is taken verbatim from the client-supplied data-URI prefix with no server-side verification against actual file bytes and no allow-list. **Fix:** allow-list accepted types + magic-byte verification. Effort: 1 week.

## 7. Background jobs

**F-BE-17 (Medium)** — No queue system anywhere (no BullMQ/Redis/SQS). `otpService.ts:41-47` blocks the request on the outbound WhatsApp Graph API call before responding. Fine at current scale; flagged as the first infra piece needed once delivery guarantees matter (digest notifications, scheduled reminders). Effort: 1 month (infra addition, see `15-Scalability.md`).

## 8. Memory / in-memory state

**F-BE-18 (High)** — `backend/src/lib/socket.ts:32-49` — `onlineUsers: Map` is per-process presence state with no shared-store story (the code comment already acknowledges this). **Why:** hard architectural ceiling — cannot horizontally scale past one instance without presence and room-broadcasts breaking across instances. **Fix:** `@socket.io/redis-adapter` + move presence to Redis. Effort: 1 week. (Full detail in `15-Scalability.md`.)

**F-BE-19 (High)** — `backend/src/services/eventService.ts:44,48-61` — `onlineVisitors: Map` is only pruned when the admin dashboard's `getOnlineVisitors()`/`getOnlineCount()` is called (pull-based). **Why:** if no admin views the live dashboard for a stretch, this map grows unbounded, gated on admin UI habits rather than data freshness. **Fix:** self-ticking `setInterval(prune, 60_000).unref()`, mirroring the correct pattern already in `lib/rateLimiter.ts:22-27`. Effort: 1 day.

**F-BE-20 (Medium)** — `backend/src/routes/whatsapp.routes.ts:25-37` — `activeSessions`/`processedMessageIds` have the same pull-based-pruning shape as F-BE-19, lower severity since webhook traffic is lower-volume. Same fix. Effort: 1 day.

**Positive:** `lib/rateLimiter.ts:20-27` gets self-pruning right (`setInterval(...).unref()` independent of call pattern) — use as the template for the two fixes above.

## 9. API versioning

**F-BE-21 (Medium)** — All 27 route groups mount directly under `/api/*` with no version segment. **Why:** no way to introduce a breaking change without breaking every client simultaneously or maintaining awkward parallel fields forever — at 1M+ users on a mobile-web frontend that can't be force-upgraded, this turns routine deploys into coordinated-release risk. **Fix:** introduce `/api/v1` now while there's a single client. Effort: 1 week.

## 10. Response consistency

Sampled `auth`, `chat`, `admin`, `users`, `upload` routes: error responses are consistently `{error: string}` with sensible status codes, success responses consistently a single object keyed by resource name — a real strength, achieved by convention rather than a shared helper (**F-BE-22, Low** — add a thin `res.fail()`/`res.ok()` helper to make it enforced rather than habitual. Effort: 1 week).

## Summary table

| # | Finding | Severity |
|---|---|---|
| F-BE-02 | Unhandled async rejections can crash the whole process | Critical |
| F-BE-12 | No startup env validation (JWT_SECRET/MONGODB_URI lazy) | Critical |
| F-BE-13 | Empty CORS_ORIGIN silently allows all origins | High |
| F-BE-15 | Uploads buffered fully in memory as base64 JSON | High |
| F-BE-18 | Socket.IO presence has no multi-instance story | High |
| F-BE-19 | Online-visitors map pruned only on admin dashboard view | High |
| F-BE-06 | Body-limit / upload-schema size mismatch (live bug) | High |
| F-BE-07 | No structured logging | High |
| F-BE-03 | auth.routes re-throw pattern assumes unreachable safety net | High |
| F-BE-04 | No 404 handler | Medium |
| F-BE-05 | CORS logic duplicated (REST vs Socket.IO) | Medium |
| F-BE-08 | Sensitive admin action logged only via console.warn | Medium |
| F-BE-09 | No centralized AppError class | Medium |
| F-BE-10 | Sequential DB awaits in onboarding join loop | Medium |
| F-BE-14 | IP hash salt silently defaults to hardcoded value | Medium |
| F-BE-16 | Chat-file MIME type trusted from client | Medium |
| F-BE-17 | No job queue; OTP send blocks request | Medium |
| F-BE-20 | WhatsApp webhook maps pruned only on traffic | Medium |
| F-BE-21 | No API versioning | Medium |
| F-BE-01 | Two route files bypass service layer | Low |
| F-BE-11 | Every login attempt writes to User doc | Low |
| F-BE-22 | Response shape consistent by convention, not enforced | Low |

**Rating: Backend 5/10.** Strong layering and consistent conventions are undermined by two critical, cheap-to-fix defects (F-BE-02, F-BE-12) that turn routine bad input or a missing env var into a full outage.
