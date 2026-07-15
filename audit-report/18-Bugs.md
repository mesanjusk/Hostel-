# 18 — Bugs

Concrete, verified defects found during this audit (as opposed to design/architecture recommendations, which live in their respective reports). Each is a real behavioral bug today, not a future scalability concern.

## BUG-01 (Critical) — Unhandled async rejections can crash the entire backend process
**File:** all 34 route files in `backend/src/routes/*.ts`; global handler at `backend/src/index.ts:168-171`.
**Trigger:** any malformed input that causes a rejected promise inside an `async` handler — trivially, `GET /api/bags/not-an-id` (a Mongoose `CastError` from an invalid ObjectId) on virtually any `:id`-scoped route.
**Behavior:** Express 4 does not forward the rejection to the error middleware; Node's default behavior for an unhandled rejection is to terminate the process — taking down the API for every connected user, not just the one bad request.
**Fix:** see `04-Backend.md` F-BE-02 / `06-API.md` F-API-01.

## BUG-02 (Critical) — Update/delete endpoints report success when nothing changed
**Files:** `notes.routes.ts:26-39`, `contacts.routes.ts:31-44`, `documents.routes.ts:31-44`, `wishlist.routes.ts:31-44`, `budget.routes.ts:37-50`, `directoryContacts.routes.ts:50-53`.
**Trigger:** PATCH/DELETE with an id that doesn't exist or belongs to another user.
**Behavior:** returns `200 {note: null}` or `200 {success:true}` instead of `404` — a client cannot tell "saved" from "silently vanished."
**Fix:** see `06-API.md` F-API-02.

## BUG-03 (High) — Chat file uploads over 10MB are rejected before validation ever runs
**Files:** `backend/src/index.ts:106-113` (global `express.json({limit:"10mb"})`) vs `backend/src/validations/upload.ts:26` (`uploadFileSchema.file.max(25_000_000)`).
**Trigger:** any chat file upload between 10MB and 25MB — the feature's own documented ceiling.
**Behavior:** Express's body parser 413s the request before the 25MB Zod validation is ever reached — the 25MB upload feature is currently unreachable for its top ~60% of allowed size range.
**Fix:** see `04-Backend.md` F-BE-06.

## BUG-04 (High) — Empty `CORS_ORIGIN` silently allows every origin
**File:** `backend/src/index.ts:71-89`.
**Trigger:** `CORS_ORIGIN` env var unset or empty in any deployment (e.g. a fresh environment, a misconfigured secret).
**Behavior:** `allowedOrigins.length === 0` is treated as "allow every origin" with `credentials:true` — the opposite of secure-by-default.
**Fix:** see `04-Backend.md` F-BE-13 / `08-Security.md` F-SEC-02.

## BUG-05 (High) — CORS preview-origin regex admits attacker-registrable domains
**File:** `backend/src/index.ts:81`.
**Trigger:** an attacker creating their own Vercel project named `hostel-jsk8-<anything>`.
**Behavior:** the regex `^https:\/\/hostel-jsk8(-[a-z0-9-]+)?\.vercel\.app$` matches the attacker's own project, granting it CORS access with `credentials:true`.
**Fix:** see `08-Security.md` F-SEC-01.

## BUG-06 (High) — Predictable `pendingId` allows JWT hijack via WhatsApp registration
**File:** `backend/src/services/waRegisterService.ts:67-92`, `backend/src/routes/waRegister.routes.ts:30-39`.
**Trigger:** an attacker racing their own `/wa-register/start` around a target's registration completion, then brute-forcing the narrow ObjectId counter range against the unauthenticated, unrate-limited `/wa-register/status` endpoint.
**Behavior:** returns a fully-valid signed JWT for the victim's new account to whoever supplies the correct `pendingId`.
**Fix:** see `07-Authentication.md` F-AUTH-07.

## BUG-07 (Medium) — Message pin/unpin toggle is not idempotent
**File:** `backend/src/routes/chat.routes.ts:142-155`.
**Trigger:** a client retry (common on flaky mobile networks) of `POST /messages/:messageId/pin`.
**Behavior:** the endpoint flips `!message.pinned` rather than setting an explicit state, so a retried request un-pins a message the user meant to pin.
**Fix:** see `06-API.md` F-API-06.

## BUG-08 (Medium) — Plaintext PIN stored alongside its bcrypt hash
**File:** `backend/src/models/User.ts:31-37`, written in `waRegisterService.ts:140,199-200`.
**Trigger:** none needed — this is a static data-at-rest exposure, not a triggered behavior.
**Behavior:** `User.waLoginPin` stores the login code in plaintext (to support resending it over WhatsApp), defeating the point of the separate bcrypt-hashed `loginPinHash` field for any account that used self-registration.
**Fix:** see `07-Authentication.md` F-AUTH-03.

## BUG-09 (Medium) — Two unauthenticated-schema request bodies accepted with no validation
**Files:** `backend/src/routes/conversations.routes.ts:16-21` (`POST /dm`), `backend/src/routes/communities.routes.ts:118-131` (moderation PATCH).
**Trigger:** any authenticated user calling either endpoint with an unexpected body shape.
**Behavior:** values flow to DB writes/lookups with no type/shape enforcement, inconsistent with the same files' sibling endpoints that do validate.
**Fix:** see `06-API.md` F-API-05.

## BUG-10 (Low) — Typing-indicator ghost events after navigating away
**File:** `frontend/src/features/community/use-chat-scope.ts:151-159`.
**Trigger:** a user types in a channel, then navigates away before the 3-second `notifyTyping` timeout fires.
**Behavior:** a `typing:stop` event emits for a scope the client has already left — mostly harmless but confusing to debug and a genuine dangling-timer leak.
**Fix:** see `03-Frontend.md` F-FE-11.

## BUG-11 (Low) — IP-hash salt silently falls back to a hardcoded, git-committed value
**File:** `backend/src/lib/geo.ts:6`.
**Trigger:** `IP_HASH_SALT` env var unset (currently not enforced at boot).
**Behavior:** analytics IP hashing uses a known public salt, letting anyone who knows it confirm whether a specific IP appears in analytics data — a privacy guarantee silently degrading rather than failing loudly.
**Fix:** see `04-Backend.md` F-BE-14 / `08-Security.md` F-SEC-07.

## Summary table

| # | Bug | Severity |
|---|---|---|
| BUG-01 | Unhandled async rejections can crash the whole process | Critical |
| BUG-02 | Update/delete report success on missing/foreign resources | Critical |
| BUG-06 | Predictable pendingId enables JWT hijack | High |
| BUG-04 | Empty CORS_ORIGIN allows every origin | High |
| BUG-05 | CORS regex admits attacker-registrable Vercel domains | High |
| BUG-03 | 25MB upload feature broken by 10MB global body limit | High |
| BUG-08 | Plaintext PIN stored alongside bcrypt hash | Medium |
| BUG-09 | Two endpoints accept unvalidated request bodies | Medium |
| BUG-07 | Message pin toggle not idempotent | Medium |
| BUG-10 | Typing-indicator dangling timer / ghost event | Low |
| BUG-11 | IP hash salt silently defaults to hardcoded value | Low |

**Rating: Bugs 5/10.** Two of these (BUG-01, BUG-02) are process-crashing / data-integrity bugs reachable by ordinary usage, not edge cases — they should be fixed before anything else in this audit.
