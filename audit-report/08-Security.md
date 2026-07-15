# 08 — Security Audit

**Scope:** JWT, bcrypt, Helmet, CORS, rate limiting, CSRF, XSS, NoSQL injection, command injection, upload security, path traversal, secrets, authorization, webhook verification. Full authentication-specific detail is in `07-Authentication.md`; this report covers the remaining OWASP-style surface.

## 1. Helmet / CSP

`backend/src/index.ts:64-69` disables CSP (`contentSecurityPolicy: false`) and sets `crossOriginResourcePolicy: {policy: "cross-origin"}`. **Assessment: acceptable.** This is a JSON-only API with no HTML-rendering surface for CSP to protect, and the cross-origin resource policy is appropriate since the frontend is a separately-hosted SPA. Low risk as configured, contingent on no endpoint ever returning attacker-influenced HTML (none found in this audit).

## 2. CORS

**F-SEC-01 (High)** — `backend/src/index.ts:81,84-100` — the Vercel-preview allowlist regex:
```js
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/hostel-jsk8(-[a-z0-9-]+)?\.vercel\.app$/;
```
matches **any** origin of the form `hostel-jsk8-<anything>.vercel.app`, not just deployments of the legitimate project. Vercel assigns production URLs as `<project-name>-<team-slug>.vercel.app`. **An attacker can create their own Vercel project named e.g. `hostel-jsk8-evil`**, which Vercel will serve at `hostel-jsk8-evil-<attackers-team>.vercel.app` — matching the regex exactly and granted `credentials: true` CORS access, fully attacker-controlled with no compromise of the real project required. Impact today is partially mitigated because auth uses a `Bearer` token from `localStorage` rather than cookies (so a page on the attacker's origin can't read the victim's token cross-origin), but this still widens the trusted-origin surface unnecessarily and is a live landmine if cookie-based auth is ever introduced. **Fix:** anchor the regex to the actual team slug, or drop the open regex in favor of Vercel's deployment-protection bypass token / a shared preview secret header. Effort: 1 day.

**F-SEC-02 (High, cross-referenced from Backend audit)** — `backend/src/index.ts:71-89` — if `CORS_ORIGIN` is unset/empty, `allowedOrigins.length === 0`, and the origin callback treats an **empty allow-list as "allow every origin"** with `credentials: true`. A missing env var silently degrades to the least-secure state instead of failing closed. **Fix:** fail closed on empty `CORS_ORIGIN` in production. Effort: 1 day.

## 3. Rate limiting

`backend/src/lib/rateLimiter.ts` is an in-memory, single-process sliding-window map backing chat messages, uploads, reports, and community creation. Fine for the current single-instance deployment (documented as such in its own comment), but see `15-Scalability.md` for why this breaks the moment there's more than one backend instance.

**F-SEC-03 (Medium/High)** — No dedicated tight rate limit beyond the generic 300/min-per-IP on `POST /api/auth/register/request-otp`, `/forgot-password/request-otp`, `POST /api/wa-register/start` (only 15s per-mobile cooldown), or `GET /api/wa-register/status` (no rate limiting at all). **Fix:** apply `express-rate-limit` scoped to `/api/auth/*` and `/api/wa-register/*` with a tighter per-IP window (10-20/min) layered on top of existing per-mobile controls. Effort: 1 week. (Detailed exploit scenario for `/wa-register/status` in `07-Authentication.md` F-AUTH-07.)

**F-SEC-04 (Low)** — `trust proxy: 1` (`index.ts:56`) is correct for Render's single reverse-proxy topology **if** Render's LB always overwrites/appends the true client IP as the trusted hop. This assumption should be verified against Render's docs — if the LB instead passes through client-supplied `X-Forwarded-For` unmodified, every IP-keyed limiter (including OTP/login guards) is trivially bypassed by header spoofing. Effort: 1 day (verification only).

## 4. NoSQL injection

**No injectable path found.** Every user-controlled value reaching a Mongoose query is either passed through a Zod `z.string()` schema (rejects object-shaped injection payloads like `{"$ne": null}` before reaching Mongo) or guarded with `typeof x === "string"`. This is a genuine strength of the codebase.

**F-SEC-05 (Low)** — `backend/src/services/collegeCategoryService.ts:78`, `courseService.ts:25`, `defaultChecklistItemService.ts:123-124` build `$regex` filters directly from unescaped user input instead of using the existing `escapeRegex` helper (correctly used elsewhere in `searchService.ts:29`, `chatService.ts:300`). Impact is low since these are behind `requireAuth + requireAdmin`, but an unescaped regex from a search box is a classic ReDoS vector (catastrophic backtracking) if ever reachable by a lower-privileged or compromised admin account. **Fix:** wrap with `escapeRegex()` for consistency/defense-in-depth. Effort: 1 day.

## 5. Command injection / code execution

Grep across `backend/src` for `eval(`, `child_process`, `exec(`, `new Function(` returned **zero matches**. No command-injection or dynamic-code-execution primitives exist anywhere in the backend.

## 6. File upload security

**F-SEC-06 (Low/Medium)** — `backend/src/validations/upload.ts:27` — `uploadFileSchema` (chat file uploads, 25MB cap) only requires the `data:` prefix, accepting **any** MIME type, unlike `uploadImageSchema` which correctly restricts to `data:image/`. A user could get a Cloudinary URL for arbitrary content (executables, disguised scripts, `data:text/html`) hosted under a trusted-looking domain and shared with other students. Cloudinary's own content-type/disposition handling contains most direct XSS risk to Cloudinary's origin rather than this app's, but it still enables malware/phishing-hosting abuse via the platform's reputation. **Fix:** enforce an explicit MIME allowlist server-side (images/video/audio/pdf/common docs). Effort: 1 week. (Cross-referenced in `04-Backend.md` F-BE-16 for the related "MIME trusted from client" finding.)

**Confirmed no path-traversal risk:** uploads never touch the local filesystem — everything is base64-in-JSON forwarded straight to Cloudinary, with folder paths built from server-derived `req.user._id`, never client-supplied filenames.

## 7. Authorization / IDOR

**Confirmed good:** every admin router mounts `requireAuth, requireAdmin`; no missing-`requireAdmin` route found across the entire route surface. User-scoped resources (`bag`, `budget`, `notes`, `documents`) all scope queries with `{_id, userId}` — no IDOR found. (See `06-API.md` F-API-02 for a related but distinct issue: these same routes return `200`/false-success instead of `404` on a foreign/missing id — not an access-control bypass, but a response-integrity issue that gives an IDOR probe an indistinguishable-looking 200 either way.)

## 8. Webhook signature verification

**Confirmed correct:** `backend/src/routes/whatsapp.routes.ts:52-70` — `verifySignature` computes HMAC-SHA256 over `req.rawBody` (captured via the `verify` callback in `index.ts:107-113`, necessary since re-serialized JSON isn't guaranteed byte-identical) and compares with `crypto.timingSafeEqual` — correctly timing-safe. No issue.

## 9. Secrets hygiene

- `backend/.env.example` contains only key names, no real values.
- `backend/.gitignore` covers `.env`/`.env.local`; confirmed no real `.env` file is tracked in git.
- Grep for hardcoded API keys/passwords/tokens across `backend/src` returned no matches.
- **F-SEC-07 (Medium, cross-referenced from Backend audit)** — `backend/src/lib/geo.ts:6` — `IP_HASH_SALT` falls back to a hardcoded, git-committed string if unset, defeating the purpose of salting IP hashes for analytics privacy. **Fix:** require at boot, no silent default for privacy-relevant secrets. Effort: 1 day.

## 10. XSS / CSRF

No server-rendered HTML surface exists (JSON API only), so classic reflected/stored-XSS-via-server-template risk is not applicable to the backend. Frontend XSS risk is bounded by React's default JSX escaping (not separately re-audited here beyond `03-Frontend.md`). CSRF is not currently a meaningful risk because auth uses a `Bearer` token read from `localStorage`, not an ambient cookie — but this is precisely why F-AUTH-08 (moving to cookie-based auth) must be paired with CSRF protection (double-submit token or `SameSite=Strict`) if ever implemented.

## Summary table

| # | Finding | Severity |
|---|---|---|
| F-SEC-01 | CORS preview-origin regex matches attacker-registrable Vercel domains | High |
| F-SEC-02 | Empty CORS_ORIGIN silently allows all origins | High |
| F-SEC-03 | No dedicated rate limit on auth/OTP/wa-register routes | Medium/High |
| F-SEC-07 | IP hash salt silently defaults to hardcoded value | Medium |
| F-SEC-06 | No MIME allowlist on chat file uploads | Low/Medium |
| F-SEC-05 | Unescaped $regex from admin search inputs (ReDoS) | Low |
| F-SEC-04 | trust proxy assumption unverified against Render's LB behavior | Low |

**No findings:** hardcoded secrets, `eval`/`child_process` usage, NoSQL injection, missing admin-route gating, IDOR on user-scoped resources, webhook timing-safe comparison, local-disk upload/path-traversal risk.

**See also `07-Authentication.md`** for the two highest-severity auth-specific findings (predictable `pendingId` JWT hijack, no token revocation) which are the most critical items in the overall security posture.

**Rating: Security 6/10.** Core primitives (bcrypt, crypto-random OTP, HMAC webhook verification, Zod-enforced query safety) are solid. The score is held back by a real account-takeover path in the WhatsApp registration flow (see Authentication report) and a CORS regex that's more permissive than intended — both concrete, fixable bugs rather than systemic weaknesses.
