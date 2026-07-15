# 06 — API Review

**Scope:** all 34 route files in `backend/src/routes/*.ts`, cross-referenced with 21 files in `backend/src/validations/*.ts`. Express `^4.21.1`, Zod `^4.4.3`, Mongoose `^9.7.3`. Mounting confirmed from `backend/src/index.ts:133-166`.

## 1. Endpoint inventory

| Route file | Base path | Endpoints (method + path) |
|---|---|---|
| auth.routes.ts | /api/auth | POST /login, /check-mobile, /register/request-otp, /register/verify, /forgot-password/request-otp, /forgot-password/reset, /onboarding; GET /me |
| profile.routes.ts | /api/profile | PATCH /, /notifications |
| categories.routes.ts | /api/categories | GET /, POST /, PATCH /:id, DELETE /:id |
| checklist.routes.ts | /api/checklist | GET /, /summary; POST /, /bulk-create, /bulk-action, /merge-duplicates; PATCH /:id/rename, /:id; DELETE /:id |
| bag.routes.ts | /api/bags | GET /, /:id; POST /; PATCH /:id; DELETE /:id |
| budget.routes.ts | /api/budget | GET /, /summary; POST /; PATCH /:id; DELETE /:id |
| notes.routes.ts | /api/notes | GET /; POST /; PATCH /:id; DELETE /:id |
| documents.routes.ts | /api/documents | GET /; POST /; PATCH /:id; DELETE /:id |
| contacts.routes.ts | /api/contacts | GET /; POST /; PATCH /:id; DELETE /:id |
| wishlist.routes.ts | /api/wishlist | GET /; POST /; PATCH /:id; DELETE /:id |
| products.routes.ts | /api/products | GET /, /:id |
| guide.routes.ts | /api/guide | GET /, /:slug |
| dashboard.routes.ts | /api/dashboard | GET /, /layout |
| search.routes.ts | /api/search | GET / |
| admin.routes.ts | /api/admin | ~50 endpoints: GET/POST/PATCH/PUT/DELETE across users, cities, places, directory-contacts, college-categories, courses, checklist-templates, default-checklist-items, suggested-items, checklist-dashboard/health, temp-users, layout/nav-layout/home-layout/landing-design |
| landing.routes.ts | /api/landing | GET /design |
| nav.routes.ts | /api/nav | GET /layout |
| home.routes.ts | /api/home | GET /layout |
| upload.routes.ts | /api/uploads | POST /image, /chat-file |
| whatsapp.routes.ts | /api/whatsapp | GET/POST /webhook-metabsp |
| waRegister.routes.ts | /api/wa-register | POST /start; GET /status |
| analytics.routes.ts | /api/analytics | POST /collect; GET /overview, /engagement, /tech, /geo, /referral, /registration-funnel, /login, /behavior, /retention, /business, /realtime |
| discovery.routes.ts | /api/discovery | GET /profile, /co-packers, /roommates, /connections/*, /blocked; PUT /profile; POST /connections, /block; PATCH /connections/:id; DELETE /block/:userId |
| directoryContacts.routes.ts | /api/directory-contacts | GET /; POST /, /:id/report; DELETE /:id |
| bookings.routes.ts | /api/bookings | GET /, /reminders/due, /:id; POST /, /:id/reminders/:key/dismiss; PATCH /:id; DELETE /:id |
| places.routes.ts | /api/places | GET /, /favorites, /:id; POST /:id/favorite; DELETE /:id/favorite |
| cities.routes.ts | /api/cities | GET / |
| collegeCategories.routes.ts | /api/college-categories | GET / |
| courses.routes.ts | /api/courses | GET / |
| communities.routes.ts | /api/communities | GET /, /mine, /:slug, /:id/members, /:id/channels; POST /, /:id/join, /:id/leave, /:id/channels; PATCH /:id/members/:userId/role, /:id/members/:userId/moderation; DELETE /:id/channels/:channelId |
| chat.routes.ts | /api/chat | GET /:scopeType/:scopeId/messages(+/search), /unread-count, /channels/:channelId/pinned; POST /messages, /read, /react, /pin; PATCH /messages/:messageId; DELETE /messages/:messageId |
| conversations.routes.ts | /api/conversations | GET /; POST /dm, /group |
| moderation.routes.ts | /api/moderation | POST /reports, /block/:userId; GET /reports; PATCH /reports/:id; POST /trace/:messageId; DELETE /block/:userId |
| users.routes.ts | /api/users | GET /:username; PATCH /me/username, /me/public-profile |

## 2. Findings

### F-API-01 — Async route handlers can crash the entire process (Critical)
**File:** all 34 files in `backend/src/routes/*.ts`; global handler at `backend/src/index.ts:168-171`.
**Problem:** Express is `^4.21.1`. Express 4 does **not** auto-catch promise rejections thrown inside `async (req, res) => {}` handlers — that behavior only arrives in Express 5. There is no `express-async-errors` import, no custom `asyncHandler`/`catchAsync` wrapper, and no `process.on("unhandledRejection", ...)` anywhere in `backend/src`. Nearly every handler in every route file is `async` with no `try/catch`.
**Why it matters:** Node terminates the process on an unhandled promise rejection by default (since Node 15, `--unhandled-rejections=throw`). Any awaited call that throws — e.g. a Mongoose `CastError` from an invalid ObjectId in a path param — becomes an unhandled rejection. This is trivial to trigger: `GET /api/bags/not-an-id`, `PATCH /api/contacts/xyz`, `DELETE /api/notes/123`, `GET /api/places/abc` — literally every `:id`-scoped route in the app (bags, budget, contacts, documents, wishlist, notes, bookings, places, admin/*/:id, chat messages) is one malformed ID away from **taking down the backend for every connected user**, not just failing the one request.
**Solution:** Either (a) upgrade to Express 5, which auto-forwards rejected promises to error middleware, or (b) add a one-line `asyncHandler` wrapper (`const ah = fn => (req,res,next) => fn(req,res,next).catch(next)`) applied to all 34 route files' handler registrations, plus a `process.on("unhandledRejection", ...)` safety net that logs instead of crashing. This is the single highest-leverage fix in this entire audit.
**Effort:** 1 day.

### F-API-02 — Destructive/update ops report false success (Critical/High)
**Files:** `backend/src/routes/notes.routes.ts:26-39` + `services/noteService.ts:15-23`; `routes/contacts.routes.ts:31-44` + `services/contactService.ts:14-21`; `routes/documents.routes.ts:31-44` + `services/documentService.ts:13-20`; `routes/wishlist.routes.ts:31-44` + `services/wishlistService.ts:14-21`; `routes/budget.routes.ts:37-50` + `services/budgetService.ts:36-45`; `routes/directoryContacts.routes.ts:50-53`.
**Problem:** `updateX`/`deleteX` use `findOneAndUpdate({_id, userId})` / `deleteOne({_id, userId})`. When the id doesn't exist or belongs to another user, the service resolves `null` / `{deletedCount:0}`, but the route still responds `200 {note: null}` or `200 {success:true}`.
**Why it matters:** A client cannot distinguish "your edit saved" from "silently vanished because the id was stale/cross-tenant." This masks real bugs (double-tap delete-then-edit races) and gives an IDOR probe an indistinguishable 200 whether a foreign id existed or not.
**Solution:** Map `null`/`deletedCount:0` to `404` in each route. `bookings.routes.ts:52-64` already does this correctly — use it as the template.
**Effort:** 1 day.

### F-API-03 — Discovery endpoints unbounded, full-collection scan (Critical for scale)
**File:** `backend/src/services/discoveryService.ts` (`findCoPackers`/`findRoommates`), routed via `backend/src/routes/discovery.routes.ts:37-55`.
**Problem:** Candidates are fetched with `TravelProfile.find({...})` and filtered **in-memory** afterward (`applyOptionalFilters`), with no DB-level `.limit()`.
**Why it matters:** This is a user-facing, frequently-hit endpoint (every user browsing discovery hits it). At 1M users the candidate pool is a full collection scan-and-filter on every request — will time out or OOM the Node process long before reaching that scale.
**Solution:** Push filters into the Mongo query, add compound indexes on filter fields, and add `.limit()`/cursor pagination.
**Effort:** 1 week.

### F-API-04 — Other unbounded list endpoints (High)
**Files:** `services/guideService.ts:7` (`guide.routes.ts:8`), `services/productService.ts:24-30` (`products.routes.ts:8-12`), `services/placeService.ts:16` (`places.routes.ts:18-26`, `admin.routes.ts:288-291`), `services/directoryContactService.ts:12` (`directoryContacts.routes.ts:16-24`).
**Problem:** These list endpoints have no `skip`/`limit`/page params — they return the entire matching set.
**Why it matters:** Guide articles, products, places, and directory contacts all grow with the user base (unlike per-user lists like notes/budget, which are correctly left unpaginated). Unbounded responses degrade linearly and will eventually exceed response-size/time budgets.
**Solution:** Add zod-validated `page`/`pageSize` query params and `.skip().limit()` + `countDocuments()`, following the pattern already used correctly in `communityService.discoverCommunities`.
**Effort:** 1 week.

### F-API-05 — Unvalidated request bodies on two authenticated endpoints (Medium)
**Files:** `backend/src/routes/conversations.routes.ts:16-21` (`POST /dm` reads `req.body.userId` with only a truthy check, no zod schema — inconsistent with the same file's `/group` endpoint two lines below, which does use `createConversationSchema.safeParse`); `backend/src/routes/communities.routes.ts:118-131` (`PATCH /:id/members/:userId/moderation` reads `req.body.muted`/`req.body.banned` directly, no schema).
**Why it matters:** Both are reachable by any authenticated (non-admin) user; arbitrary-typed values flow into DB writes/queries unchecked.
**Solution:** Add zod schemas matching the pattern used elsewhere in the same files.
**Effort:** 1 day.

### F-API-06 — Idempotency bug: pin toggle via POST (Medium)
**File:** `backend/src/routes/chat.routes.ts:142-155` (`POST /messages/:messageId/pin` does `!message.pinned`).
**Problem:** A POST whose effect depends on hidden server state is not idempotent — a client retry on a flaky connection can double-toggle and end up unpinning a message it meant to pin.
**Solution:** Make it `PUT` with an explicit `{pinned: true|false}` body.
**Effort:** 1 day.

### F-API-07 — Status codes overload 400 for "not found"/"conflict" (Medium)
**Files:** `backend/src/routes/bag.routes.ts:47-49,67-69,76-79` and nearly every block in `admin.routes.ts:165-423` (users, products, guide, cities, places, college categories, courses, checklist templates).
**Problem:** Real validation failures and business-rule failures ("Bag not found", "already exists") both collapse onto `res.status(400)`.
**Why it matters:** Clients/monitoring can't distinguish "fix your input" (400) from "resource doesn't exist" (404) from "conflict" (409), which is exactly the distinction `categories.routes.ts:72` (409 for `MOVE_REQUIRED`) and `bookings.routes.ts` (404 for missing) already get right elsewhere in the same codebase.
**Solution:** Standardize service-layer errors with a code (`NOT_FOUND`/`CONFLICT`/`VALIDATION`) and map centrally to status codes.
**Effort:** 1 week (touches ~20 call sites).

### F-API-08 — No 201 on creates, no shared pagination envelope (Medium/Low)
**Problem:** Every creating `POST` (~20+ endpoints) returns bare `200` instead of `201`. Paginated list endpoints use at least three different response shapes: `{items, total, page, pageSize}` (`admin.routes.ts:476`), `{communities, total, page, pageSize}` (`communities.routes.ts:37-38`), and `{users, total}` with no page/pageSize echoed (`admin.routes.ts:96-113`).
**Solution:** Define one `PaginatedResponse<T>` type/helper and reuse it; switch creates to 201. Low urgency, high consistency value.
**Effort:** 1 week.

### F-API-09 — ~150 lines of copy-pasted admin CRUD (Medium, ties to Dead-Code/Duplicate-Code reports)
**File:** `backend/src/routes/admin.routes.ts:165-423`.
**Problem:** The identical `safeParse → 400 → service call → 400-on-failure → 200` skeleton is repeated per-resource for cities, places, products, guide articles, college categories, courses, checklist templates, default checklist items — no shared generic CRUD handler.
**Why it matters:** Every fix to the 400-vs-404 issue (F-API-07) must be applied ~8 times instead of once; drift between copies is inevitable.
**Solution:** Extract a generic `createAdminCrudRouter(schema, service)` factory.
**Effort:** 1 month (careful refactor, high blast radius, needs full regression pass since there's no test suite — see `18-Bugs.md`/testing gap in `17-Best-Practices.md`).

### F-API-10 — Two independent implementations of "list places by city" (Low)
**Files:** `places.routes.ts:12-16` (zod-validated, `city` required) vs `admin.routes.ts:288-291` (ad hoc, unvalidated, `city` optional) — both call `placeService.listPlaces` but with differently-validated inputs.
**Solution:** Route the admin list through the same validated query schema.
**Effort:** 1 day.

### F-API-11 — Inconsistent resource pluralization (Low)
**Problem:** `/api/wishlist` is singular where `/api/bags`, `/api/notes`, `/api/contacts` etc. are plural; `/api/budget` and `/api/checklist` are singular (defensible as singleton-per-user resources). No functional bug, but unpredictable for API consumers.
**Solution:** Standardize on plural nouns for collection resources in a future major version; not worth a breaking change on its own.
**Effort:** 1 day (documentation-only) / 1 week (actual rename with redirects, low priority).

## 3. What's already good

- 34 route files, ~29 correctly validate every body/query input via Zod — validation coverage is strong overall.
- List endpoints consistently wrap arrays in a named key (no bare-array responses).
- `analytics.routes.ts:60` correctly uses 202 for async ingestion; `categories.routes.ts:72` correctly uses 409; `auth.routes.ts:59,157` correctly use 429 for rate limiting — these are the right patterns and should be the template applied to the rest of the API.
- The WhatsApp webhook (`whatsapp.routes.ts`) correctly relies on HMAC signature verification instead of Zod for a third-party payload — appropriate control for that trust boundary.

## 4. Rating

**API layer: 5.5/10** — validation discipline is good, but the missing async-error handling (F-API-01) is a production-crashing bug, not a style nit, and the unbounded list endpoints (F-API-03/04) will not survive scale.
