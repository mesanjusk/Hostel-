# 07 — Authentication Review

**Scope:** `backend/src/middleware/auth.ts`, `backend/src/lib/jwt.ts`, `backend/src/lib/pin.ts`, `backend/src/services/authService.ts`, `backend/src/services/otpService.ts`, `backend/src/services/waRegisterService.ts`, `backend/src/routes/auth.routes.ts`, `backend/src/routes/waRegister.routes.ts`. This app's login model (per root `README.md:3`): mobile number + a login "code" (4-7 digits), never a traditional password — either admin-provisioned or self-registered via WhatsApp OTP, which becomes the permanent login code.

## 1. JWT / session lifecycle

**F-AUTH-01 (High)** — `backend/src/lib/jwt.ts:4,10`, `backend/src/middleware/auth.ts:17-39` — `TOKEN_TTL = "30d"`, and `requireAuth` only checks signature validity plus that the user document still exists. There is no `tokenVersion`/`sessionId` compared against the user record. **Why it matters:** resetting a PIN, an admin regenerating a user's PIN, or an admin demoting/banning a user does **not** invalidate previously issued tokens — they remain valid for up to 30 days. There's no server-side logout (logout is `localStorage.removeItem` only). A leaked token (XSS, log capture, shared device) can only be remediated by rotating `JWT_SECRET` globally, logging out every user in the system. **Fix:** add a `tokenVersion` field on `User`, embed it in the JWT payload, compare on every `requireAuth` call, bump it on PIN reset/regenerate/role change/explicit logout. Effort: 1 week.

**F-AUTH-02 (Low)** — `backend/src/lib/jwt.ts:17` — `jwt.verify(token, JWT_SECRET)` doesn't pass an explicit `{algorithms:["HS256"]}` allowlist. Current `jsonwebtoken` versions default safely, but this is implicit rather than explicit — a library downgrade/misconfig could silently widen accepted algorithms. **Fix:** pass `algorithms` explicitly. Effort: 1 day.

**Positive:** no fallback/default JWT secret exists anywhere — both sign and verify throw if `JWT_SECRET` is unset. Correctly implemented (though see `04-Backend.md` F-BE-12 for the startup-validation gap that means this only surfaces as a runtime crash, not a boot-time failure).

## 2. PIN / credential security

**Positive:** `backend/src/lib/pin.ts` uses `bcrypt.hash`/`bcrypt.compare` (cost factor 10) for `loginPinHash`; OTP codes are hashed the same way in `otpService.ts:35,63`. Comparison via `bcrypt.compare` is constant-time by design.

**F-AUTH-03 (Medium/High)** — `backend/src/models/User.ts:31-37`, written in `waRegisterService.ts:140,199-200` — `User.waLoginPin` stores the visitor's 4-digit PIN **in plaintext** alongside `loginPinHash`, so it can be resent over WhatsApp on request. **Why it matters:** a database dump/backup leak or insider access yields ready-to-use login codes for every `/wa-login` account with zero cracking effort, defeating the purpose of hashing everywhere else in the system. **Fix:** encrypt `waLoginPin` with AES-256-GCM using a server-side key not stored in Mongo, or stop persisting it and generate+send a **new** code on every resend request (accept the code-rotation UX cost). Effort: 1 week.

**F-AUTH-04 (Low, scaling note not a vulnerability)** — bcryptjs is pure-JS (slower than native `bcrypt`/`argon2` under load). At 1M+ users this raises CPU cost per login/OTP-verify; consider migrating to native `bcrypt` or `argon2` for throughput. Effort: 1 week.

## 3. OTP flow

**Positive design, confirmed correct:** generation via `randomInt(100000, 1000000)` (crypto-secure, `otpService.ts:17-19`); hashed at rest; single-use (`used` flag); 10-minute TTL; capped at 5 verify attempts (`MAX_VERIFY_ATTEMPTS`, line 59) — a 6-digit code (1M keyspace) is effectively brute-force-proof with a 5-try cap. 60-second resend cooldown per mobile+purpose.

**F-AUTH-05 (Medium/High)** — `otpService.ts:24-51`, reachable via `auth.routes.ts:80,139` — no daily/absolute cap on OTP sends, only the 60s cooldown. **Why it matters:** an attacker who knows/enumerates a victim's mobile number can trigger a WhatsApp OTP once every 60 seconds indefinitely (1,440/day) — a harassment vector (repeated WhatsApp messages to the victim) and a direct cost-exhaustion attack against the paid WhatsApp Cloud API quota. The only backstop is the generic 300/min-per-IP limiter, trivially defeated with rotating IPs. **Fix:** add a per-mobile daily cap (5-10/day) independent of the 60s cooldown, and a dedicated tighter per-IP+per-mobile limiter on `/register/request-otp` and `/forgot-password/request-otp`. Effort: 1 week.

## 4. Login attempt limiting

**Positive:** `POST /api/auth/login` is protected by a durable, **per-mobile, database-backed** check (`authService.ts:6-7,34-39`) — 5 attempts/15 minutes, persisted on the User document (self-trimming array) — this survives process restarts and multiple instances, unlike the in-memory limiters used elsewhere. This is a solid, correctly-designed control.

**F-AUTH-06 (Low)** — `authService.ts:41-57` — every login attempt (success or failure) performs a synchronous `await user.save()`. Under a credential-stuffing burst against one mobile number, every attempt is a full document write — a write-amplification vector. Cross-referenced in `04-Backend.md` F-BE-11. Effort: 1 week.

## 5. WhatsApp self-registration hijack risk

**F-AUTH-07 (High)** — `waRegisterService.ts:67-92`, `waRegister.routes.ts:30-39` — `GET /api/wa-register/status?pendingId=<id>` is **unauthenticated**, and once the WhatsApp handshake completes, returns a fully-valid signed auth token to whoever supplies the correct `pendingId`. `pendingId` is a MongoDB ObjectId — for this single-process app, ObjectIds generated close in time share the same per-process random component and differ only by a small incrementing counter plus a timestamp, making them **predictable/enumerable**, not cryptographically opaque. An attacker who triggers their own `/wa-register/start` around the time a target's registration completes can narrow the counter range and brute-force the remainder — and `/status` has **no dedicated rate limiter at all** beyond the generic 300/min. **Why it matters:** this is a direct account-takeover path — an attacker who wins this race obtains a valid JWT for the victim's new account. **Fix:** never issue an auth token from a GET endpoint keyed only by a guessable ObjectId. Return a separate high-entropy polling token (`crypto.randomBytes(32)`) to the original requester only, require it in addition to `pendingId` on `/status`, and add a dedicated rate limit to this endpoint. Effort: 1 week. **This is one of the highest-priority security fixes in the whole audit.**

## 6. Token storage (frontend cross-reference)

**F-AUTH-08 (Medium)** — `frontend/src/lib/api.ts:15,20,22` — the JWT is stored in `localStorage`, readable by any JS on the frontend origin. Combined with the 30-day non-revocable TTL (F-AUTH-01), a single frontend XSS bug yields a month-long account-takeover token with no remediation short of a global secret rotation. **Fix:** move to httpOnly, `SameSite=Strict/Lax` cookies (adds CSRF protection needs for state-changing routes), or at minimum pair short-lived access tokens + rotating refresh tokens with the `tokenVersion` fix. Effort: 1 month (meaningful architecture change touching both frontend and backend).

## 7. Authorization gating (cross-referenced from Security audit)

**Positive:** every admin router mounts `requireAuth, requireAdmin` at the top (`admin.routes.ts:89`, `analytics.routes.ts:64`); `moderation.routes.ts` correctly layers per-route `requireAdmin` on top of router-level `requireAuth`. No missing-`requireAdmin` route was found across the API surface. User-scoped resource services (`bag`, `budget`, `notes`, `documents`) all correctly scope queries with `{_id, userId}` — no IDOR found on these resources.

## Summary table

| # | Finding | Severity |
|---|---|---|
| F-AUTH-07 | Predictable pendingId enables JWT hijack via /wa-register/status | High |
| F-AUTH-01 | No JWT revocation / tokenVersion (30-day non-revocable tokens) | High |
| F-AUTH-03 | Plaintext waLoginPin stored alongside bcrypt hash | Medium/High |
| F-AUTH-05 | OTP-bombing: no daily cap on OTP sends per mobile | Medium/High |
| F-AUTH-08 | JWT in localStorage (no httpOnly cookie) | Medium |
| F-AUTH-02 | jwt.verify doesn't pin algorithms explicitly | Low |
| F-AUTH-04 | bcryptjs may bottleneck CPU at 1M+ scale | Low |
| F-AUTH-06 | Every login attempt writes to User document | Low |

**Rating: Authentication 5/10.** OTP and login-attempt limiting are genuinely well-built (crypto-secure generation, bcrypt hashing, durable per-mobile lockout). The score is dragged down by one real account-takeover path (F-AUTH-07) and the lack of any token revocation mechanism (F-AUTH-01) — both fixable without redesigning the login model.
