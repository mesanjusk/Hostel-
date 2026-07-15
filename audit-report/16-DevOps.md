# 16 — DevOps Review

**Scope:** `backend/render.yaml`, `frontend/vercel.json`, both `package.json` files, `backend/src/index.ts`, `backend/src/db.ts`, `backend/src/lib/socket.ts`, root `README.md`. Confirmed via `find`/`ls` (not assumed): **no `.github/workflows/`, no Dockerfile anywhere, no `docker-compose.yml`, no nginx config, no `.dockerignore`, no k8s manifests, no PM2 ecosystem file, no CI config of any kind.** The only infra files in the repo are `backend/render.yaml` and `frontend/vercel.json`.

## F-DEVOPS-01 (Critical) — No CI/CD pipeline
**Finding:** No `.github/workflows/` or equivalent. `backend/package.json` has `typecheck`/`build` scripts and `frontend/package.json` has `lint`/`typecheck` scripts, but nothing invokes them automatically on push/PR. There are also zero test scripts in either `package.json` — no test runner dependency at all.
**Why it matters:** every merge to main goes straight to Render/Vercel's buildpack with no automated gate. At 1M users, a bad deploy isn't an inconvenience — it's an outage affecting the entire user base at once (single-instance, see `15-Scalability.md`), with no automated signal until users complain.
**Solution:** a GitHub Actions workflow on `pull_request`/`push` running `npm ci && npm run typecheck && npm run lint` (frontend) and `npm run typecheck && npm run build` (backend) at minimum; add a real test suite and gate merges on it. Effort: 1 week.

## F-DEVOPS-02 (High) — No containerization
**Finding:** no Dockerfile for backend or frontend, no `.dockerignore`. Deploy relies entirely on Render's Node buildpack and Vercel's Vite preset.
**Why it matters:** buildpack deploys aren't independently reproducible/testable locally, can't be scanned by container security tooling, and don't guarantee a local build behaves identically to what Render executes. This becomes a hard blocker the moment container orchestration (ECS/K8s/Cloud Run) is needed for multi-region or provider-agnostic redundancy.
**Solution:** a multi-stage Dockerfile for the backend (build stage → slim runtime stage with only `dist/` + prod deps + non-root user) and a `.dockerignore`. Effort: 1 week.

## F-DEVOPS-03 (Critical) — render.yaml: free tier, missing env vars, no health-check wiring
**File:** `backend/render.yaml`.
**Problems:**
- `plan: free` (line 6) — spins down after 15 minutes of inactivity (multi-second cold-start including a fresh Mongo connection), is a **single instance** with zero redundancy, and has tight CPU/RAM limits.
- No `healthCheckPath` key — Render only gets a TCP/port check, not an app-level health signal.
- **Missing env vars** that the code actually reads (cross-checked against `.env.example`): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (used in `lib/cloudinary.ts`), `IP_HASH_SALT`, `ANALYTICS_TTL_DAYS` — all absent from `render.yaml`'s `envVars` list.
**Why it matters:** anyone deploying via Render's Blueprint feature (offered explicitly in `README.md:114`) gets a backend that boots successfully and passes health checks but silently fails all image/attachment uploads — discovered only when a user reports broken photo uploads, not at deploy time.
**Solution:** add the missing `sync: false` env var entries; upgrade `plan` to at least `standard` before real traffic; add `healthCheckPath: /health`. Effort: 1 day (config) + cost decision (plan upgrade).

## F-DEVOPS-04 (High) — Health check is a static liveness stub
**File:** `backend/src/index.ts:115-117` — `GET /health` returns `{status:"ok"}` unconditionally, regardless of MongoDB connectivity.
**Why it matters:** if Mongo is unreachable, the process stays "healthy" from the platform's point of view while every real request fails — worse than no check in some ways, since it hides failures instead of surfacing them.
**Solution:** check `mongoose.connection.readyState` (or a lightweight ping), return 503 on failure; wire an external uptime monitor. Effort: 1 day.

## F-DEVOPS-05 (High) — No graceful shutdown
**Finding:** zero `SIGTERM`/`SIGINT` handlers anywhere in `backend/src`. On redeploy/restart, Render sends `SIGTERM`; with no handler, in-flight HTTP requests, open Socket.IO connections, and the Mongoose connection are all cut abruptly.
**Why it matters:** every deploy becomes a mini-outage for whoever has an in-flight request or open chat socket. At 1M users with frequent deploys, this compounds into a steady trickle of failed requests and dropped chat sessions.
**Solution:**
```ts
process.on("SIGTERM", async () => {
  httpServer.close(() => process.exit(0));
  io.close();
  await mongoose.connection.close();
});
```
with a hard-exit timeout fallback. Effort: 1 day.

## F-DEVOPS-06 (Medium) — Single-process, no multi-core utilization
**Finding:** no PM2 ecosystem file, no `pm2` dependency, no Node `cluster` usage. `start` script is `node dist/index.js` — one process.
**Why it matters:** Node is single-threaded for JS execution; one process uses at most one CPU core regardless of the underlying VM's core count.
**Solution:** for Render specifically, scale horizontally via multiple instances (Render's idiomatic model) rather than in-box clustering — but this requires fixing the in-memory-state issues in `15-Scalability.md` first. Effort: bundled with scalability fixes.

## F-DEVOPS-07 (High) — No structured logging or error tracking
**Finding:** grepped both `package.json` files for `pino`, `winston`, `sentry`, `opentelemetry`, `prometheus`, `datadog`, `newrelic` — zero matches. Only `console.*` logging exists.
**Why it matters:** at 1M users you cannot practically grep raw stdout to find one failing request among millions; without Sentry (or equivalent) production exceptions are invisible until a user reports them.
**Solution:** add Sentry for error tracking, pino for structured JSON logs with request-ID correlation, basic metrics export (OpenTelemetry/Prometheus). Effort: 1 week.

## F-DEVOPS-08 (Low, informational) — Vercel frontend deploy config
**File:** `frontend/vercel.json` — only SPA rewrites, no explicit cache-control/compression config.
**Assessment:** this is fine as-is — Vercel automatically applies immutable long-TTL caching and CDN + brotli/gzip compression to hashed static assets without any config needed. No action required.

## Summary table

| # | Finding | Severity |
|---|---|---|
| F-DEVOPS-01 | No CI/CD pipeline of any kind | Critical |
| F-DEVOPS-03 | render.yaml: free tier + missing secrets + no health-check wiring | Critical |
| F-DEVOPS-04 | Health check doesn't verify DB connectivity | High |
| F-DEVOPS-05 | No graceful shutdown (SIGTERM handling) | High |
| F-DEVOPS-07 | No structured logging or error tracking (Sentry/pino) | High |
| F-DEVOPS-02 | No containerization (Dockerfile/docker-compose) | High |
| F-DEVOPS-06 | Single process, no multi-core utilization | Medium |
| F-DEVOPS-08 | Vercel config minimal but sufficient (informational) | Low |

**Rating: DevOps 2.5/10.** This is the weakest-scoring area of the entire audit — there is currently zero automated quality gate before production, zero observability, and zero deploy resilience. None of the individual fixes are architecturally hard; they're simply all absent.
