# 15 — Scalability Review

**Question:** can this architecture support 1,000 / 10,000 / 100,000 / 1,000,000 concurrent users?

## Current architecture snapshot

- Single Render web-service instance (free tier), single Express process, no cluster/PM2.
- Single MongoDB Atlas connection string, default (unconfigured) connection pool, comments in the code (`User.ts:40`, `AnalyticsEvent.ts:35`, `whatsapp.routes.ts:21`) indicating the Atlas cluster is at or near its **free/shared-tier collection cap**.
- Socket.IO with the **default in-memory adapter** — no Redis anywhere in the codebase (confirmed by grep: zero matches for "redis" in `backend/src` or either `package.json`).
- Two independent **in-memory** rate limiters (`express-rate-limit`'s default store in `index.ts:121-129`, and the hand-rolled `lib/rateLimiter.ts`), both explicitly documented in their own comments as single-process-only.
- No caching layer (no Redis/Memcached/node-cache) anywhere.
- No background job queue (no BullMQ/Bull/Agenda/RabbitMQ/Kafka) — confirmed by grep, zero matches.
- No aggregation pipelines for analytics — `.aggregate(` returns zero matches across `backend/src`; analytics services `find()` raw rows and reduce in Node instead.
- Uploads are base64-in-JSON to Cloudinary (not multipart/streaming) — bounded but memory-multiplying per concurrent upload.
- No containerization, no CI/CD (see `16-DevOps.md`).

## Verdict by tier

### 1,000 concurrent users — **Yes, with caveats.**
A single Render instance + single Atlas connection can plausibly absorb this. The free-tier cold-start/sleep-after-inactivity behavior means the *first* request after any idle period is painfully slow, and the total lack of monitoring means degradation would go unnoticed. **Required before this tier is genuinely safe:** upgrade off the free Render plan, add the missing Cloudinary/analytics env vars to `render.yaml` (`16-DevOps.md` F-DEVOPS-03), add basic error tracking (F-DEVOPS-07).

### 10,000 concurrent users — **Marginal; several fixes required first.**
Free-tier Render will not sustain this (CPU/RAM caps, single instance, no redundancy). Still doesn't require multiple instances, but needs: a paid Render plan sized for the load, graceful shutdown (F-DEVOPS-05) so deploys don't drop live connections at this volume, a real DB-aware health check (F-DEVOPS-04), and moving the WhatsApp OTP send off the synchronous request path (`otpService.ts:41-47` blocks on the Meta Graph API call) since a registration burst would otherwise pile up blocked connections. The in-memory rate limiter and Socket.IO adapter are still fine here since the app is still single-instance.

### 100,000 concurrent users — **Not currently possible without core fixes.**
This tier requires horizontal scaling (multiple instances), which is **blocked simultaneously by three Critical issues**:

1. **Socket.IO's in-memory adapter breaks chat/presence across instances** (`lib/socket.ts:32-49` — the code's own comment acknowledges "fine for this app's single Render instance... a multi-instance deploy would need this backed by a shared store"). A chat message from a user on instance A never reaches a recipient on instance B. Needs `@socket.io/redis-adapter` + moving `onlineUsers` presence tracking to Redis.
2. **In-memory rate limiters become silently ineffective across instances** — each instance maintains its own counter, so a client's effective rate limit becomes `limit × instance_count` instead of the intended ceiling, defeating the abuse guard exactly when it matters most. Needs `rate-limit-redis` (or equivalent) as a shared store.
3. **The shared/low Atlas tier will hit connection and throughput limits** well before this volume (a free/M0-class tier caps connections around ~500; Mongoose's default `maxPoolSize` of 100 per process × multiple instances exhausts this fast — and `db.ts:18` doesn't even set an explicit pool size). Needs a dedicated Atlas tier (M10+).

Also needed by this point: CI/CD (`16-DevOps.md` F-DEVOPS-01) — manually deploying to a service serving 100K concurrent users with no automated test/lint gate is a significant operational risk — and structured logging + APM to diagnose issues at this volume.

### 1,000,000 concurrent users — **Not achievable on the current architecture.**
All 100K blockers apply, plus:
- **A caching layer is required** (`05-Database.md` F-DB-13) — analytics/dashboard endpoints doing manual JS aggregation over raw `find()` results will not hold up under repeated load at this scale.
- **Background job queues become mandatory**, not optional, for OTP sends, webhook processing, and analytics roll-ups (`04-Backend.md` F-BE-17).
- **Containerization becomes practically necessary** for reproducible, orchestrated multi-region/multi-provider deployment rather than depending on one PaaS's buildpack.
- **The database needs an explicit scaling strategy** — read replicas at minimum (`readPreference: secondaryPreferred` for analytics/dashboard reads), sharding evaluated before data volume makes resharding painful.
- **Manual JS aggregations must convert to native Mongo aggregation pipelines** with proper indexing (`05-Database.md` F-DB-11/F-DB-12 — the `.distinct()` calls on `AnalyticsEvent` will hit MongoDB's hard 16MB result-size limit and hard-fail, not just slow down, well before 1M active users).
- **Full observability** (structured logs, metrics, tracing) is required to operate at this scale at all.

None of this is exotic — it's the standard Redis + queue + CDN + observability stack — but essentially all of it is currently absent, confirmed by direct grep across the codebase, not assumed.

## Ordered blockers to climb each tier

**1K → 10K:** upgrade Render plan off free tier; add missing env vars to `render.yaml`; add graceful shutdown; add basic error tracking.

**10K → 100K:** add Redis for the Socket.IO adapter and the rate limiter; upgrade to a dedicated Atlas tier; stand up CI/CD; move OTP send to a queue.

**100K → 1M:** add a caching layer for analytics/dashboard; move WhatsApp/webhook/analytics work fully into background workers; containerize for portability/orchestration; convert manual JS aggregations to native Mongo aggregation pipelines with proper indexing; add full observability.

## Rating

**Scalability: 3/10.** The application logic itself (stateless JWT auth, Cloudinary for object storage, generally sound schema design) is scale-ready in principle. The infrastructure and a small number of specific implementation choices (in-memory Socket.IO adapter, in-memory rate limiters, no Redis, no queue, no aggregation pipelines) are the entire gap — this is an infrastructure-maturity problem, not a rewrite.
