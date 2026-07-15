# 05 — Database Review (MongoDB / Mongoose)

**Scope:** all 34 files in `backend/src/models/*.ts`, `backend/src/db.ts`, and query usage across ~25 services. Overall this is an unusually well-documented schema layer — most models already carry index rationale in comments, and the team clearly reasoned about the Atlas free-tier collection cap. The serious risks at 1M+ users are not "missing basic indexes" but rather unbounded `.distinct()` calls, a non-prefix regex search, sequential N+1 round trips, and denormalized counters updated without transactions.

## 1. Indexes

**F-DB-01 (Critical)** — `backend/src/services/searchService.ts:29,56` — `User.find({username: regex})` uses a case-insensitive, **non-anchored** regex (`new RegExp(escapeRegex(query), "i")`), which cannot use `User.username`'s existing index — Mongo must scan every document. **Why:** at 1M+ users, every keystroke in global search triggers a full collection scan + regex test, competing with the operational read/write path for CPU. Same pattern on `Community.find({name: regex})` and `GuideArticle` (Low severity — small admin-managed catalogs). **Fix:** prefix-anchor the regex (`^${escapeRegex(query)}`) to use the index as a range scan, or add a text/Atlas Search index for substring matching. Effort: 1 week.

**F-DB-02 (Medium)** — `backend/src/models/OtpVerification.ts:5,17`, queried in `otpService.ts:27,58` — hot path `{mobile, purpose}` sorted by `createdAt` has no compound index (only `mobile` is indexed). **Fix:** `.index({mobile:1, purpose:1, createdAt:-1})`. Effort: 1 day.

**F-DB-03 (Low)** — `backend/src/models/WaPendingRegistration.ts:9` — same missing-compound-index pattern. Effort: 1 day.

**F-DB-04 (Low)** — `backend/src/models/Conversation.ts:9,23` — `memberIds` has both a redundant standalone `index:true` and a compound `{memberIds:1, lastMessageAt:-1}` index; the standalone index is redundant (compound index's prefix already serves it) and doubles multikey-index write cost on every message send. **Fix:** drop the inline `index:true`. Effort: 1 day.

**F-DB-05 (Low)** — `backend/src/models/Booking.ts:14,61` — `listBookings(userId, category)` filters `{userId, category}` but the compound index is only `{userId,eventTime}`. Low impact since bookings-per-user is naturally small.

**Confirmed correctly indexed, no action needed:** `AnalyticsEvent` (incl. TTL), `Bag`, `Category`, `Channel`, `CommunityMember`, `Community`, `Course`, `TravelProfile` (4 purpose-built compound indexes matching its query shapes), `Message`, `ReadState`, `Report`, `UserChecklist`, `Connection`.

## 2. Unique constraints

Nearly every uniqueness-sensitive field is enforced at the **schema level**, not just in application code: `User.mobile`, `User.username` (sparse+unique), `TempUser.mobile`, `GuideArticle.slug`, `CollegeCategory.slug`, `City.name`, `Course{collegeCategoryId,slug}`, `Community.slug`+`{type,scopeKey}`, `Channel{communityId,slug}`, `Bag{userId,name}`, `Category{userId,normalizedName}`, `Conversation.dmKey`, `CommunityMember{communityId,userId}`, `Connection{requesterId,recipientId,context}`, `ReadState{userId,scopeType,scopeId}`, `UserChecklist{userId,defaultChecklistItemId}`, `LandingDesign.page`, `UiLayout.page` — this is above-average diligence.

**F-DB-06 (Medium)** — `backend/src/models/OtpVerification.ts` (no unique constraint), `services/otpService.ts:24-37` — `requestOtp` does `deleteMany` then `create` as two separate ops with no DB-level guard; two concurrent "resend" requests racing the cooldown check can both insert a valid code. **Fix:** atomic `findOneAndUpdate({upsert:true})`, or a partial unique index scoped to `used:false`. Effort: 1 week.

**F-DB-07 (Low)** — `WaPendingRegistration` — same class of race, lower impact (TTL-bounded, non-auth-critical).

## 3. N+1 queries

**F-DB-08 (High)** — `backend/src/services/communityService.ts:186-194` (`ensureAutoJoinCommunities`) — sequential `await ensureCommunity(...)` per entry in `user.interests` (an array uncapped by count), each doing up to ~7 round trips (findOne, maybe create, 5 channel upserts). **Why:** runs on every onboarding/profile update — a user with 20 interests turns one save into ~140 sequential round trips; at 1M users during a registration wave this becomes the dominant source of DB load. **Fix:** cap `interests` array length in validation (e.g. max 10) and parallelize with `Promise.all`. Effort: 1 week.

**F-DB-09 (High)** — `backend/src/services/conversationService.ts:63-74` — one `Message.countDocuments()` per conversation (up to 100, `Promise.all`-parallelized but still up to 100 round trips per single inbox-open request). **Why:** 10k concurrent users opening their inbox fan out to up to 1M query-equivalents in bursts vs. one aggregation. **Fix:** replace with one `Message.aggregate([{$match:{scopeId:{$in:[...]}}}, {$group...}])`. Effort: 1 week.

**Positive:** `searchService.globalSearch` correctly batches its bag lookup with a single `$in` query — the N+1 findings above are exceptions, not the norm.

## 4. Pagination

**F-DB-10 (Medium)** — Per-user list services (`budgetService.ts:7,12`, `bookingService.ts:26,127,142`, plus `Note`/`DocumentItem`/`EmergencyContact`/`WishlistItem`) have no `.limit()`. `getBudgetSummary` pulls **every** entry for a user and sums in Node via `.reduce()` instead of a Mongo `$group`. **Why:** not a "1M total users" problem (each user's data is naturally small) — it's an **unbounded-per-account-growth** problem: nothing caps how many entries one account can create, so a buggy retry loop or abusive account with hundreds of thousands of rows makes every dashboard load for that account a full unpaginated fetch computed in Node. **Fix:** push `getBudgetSummary` into a Mongo `$group`, add `.limit()`/cursor pagination defensively to all list endpoints regardless of expected volume. Effort: 1 week.

**Positive:** `communityService.discoverCommunities`/`listMembers` (proper skip/limit + `countDocuments`) and `chatService.listMessages` (proper `_id`-cursor pagination) are the correct template already present in the codebase.

## 5. Aggregation pipelines / analytics

**F-DB-11 (Critical)** — `businessAnalyticsService.ts:29-40`, `loginAnalyticsService.ts:32-43`, `visitorAnalyticsService.ts:32,68-71` — heavy reliance on `AnalyticsEvent.distinct("visitorId"/"userId", match)`. `.distinct()` returns the **entire result array in one BSON document**, subject to MongoDB's hard 16MB response cap — no cursor/streaming variant exists. **Why:** at 1M+ users with routine daily activity, `distinct("visitorId")` over even a 30-day window can trivially exceed a few million distinct IDs — tens of MB, exceeding the cap and causing a hard `"distinct too large"` failure (not a slow query — a broken dashboard), well before reaching 1M active users. **Fix:** replace with `$group`+`$count` (streams through the pipeline instead of materializing the full list); only return actual ID lists where the range is bounded (e.g. per-day windows). Effort: 1 week.

**F-DB-12 (High)** — `backend/src/services/behaviorAnalyticsService.ts:41-47,164-168` (`getNavigationFlow`, `getPageEngagement`) — unlimited `.find().select().sort().lean()` pulling every matching page-view row into Node to bucket in JavaScript, contrasted with `getSessionAnalytics` in the same file which correctly uses a Mongo `$group` pipeline. **Why:** a 30-day admin dashboard query can fetch tens of millions of raw documents into one Node process — OOM risk and multi-second latency vs. sub-second aggregation. **Fix:** rewrite using `$group`, mirroring `getSessionAnalytics`'s existing pattern. Effort: 1 week.

**F-DB-13 (Medium)** — No caching layer for `businessAnalyticsService`, `retentionService` (fixed 90-day lookback every call), `registrationFunnelService`, `visitorAnalyticsService` — every dashboard view/poll recomputes from scratch. **Fix:** short-TTL cache (Redis) keyed by `(range, metric)`. Effort: 1 week (contingent on Redis being introduced — see `15-Scalability.md`).

**Positive:** `checklistAnalyticsService.getDefaultItemAnalytics` is the standout example — uses `$group` for exact counts and a bounded `$sample` for statistical hints, explicitly reasoning about not pulling millions of rows into memory. This is the pattern the rest of the analytics layer should be brought up to.

## 6. Transactions

No Mongo sessions/multi-document transactions found anywhere in `services/`.

**F-DB-14 (Medium-High)** — `backend/src/services/communityService.ts:91-93,113-116` — `CommunityMember.create()` and `Community.findByIdAndUpdate({$inc:{memberCount:1}})` are two separate, non-atomic writes. **Why:** a crash between them (deploy restart, OOM kill, network blip) permanently drifts the counter from true membership count, with no reconciliation job anywhere to detect/correct it. `memberCount` isn't cosmetic — `discoverCommunities` sorts by it, making it the primary discovery-ranking signal. Over months at 1M+ users doing millions of join/leave actions, drift will visibly misrank communities. **Fix:** wrap both writes in a `mongoose.startSession()` transaction (the app already targets a replica-set-capable Atlas cluster), or drop the denormalized field and compute via `countDocuments()` at read time / a periodic reconciliation job. Effort: 1 week.

**F-DB-15 (Low)** — `chatService.ts:87-104` — `Message.create()` + `Conversation.findByIdAndUpdate()` (lastMessageAt/preview) is the same non-atomic pattern, but lower severity — cosmetic drift only (message isn't lost, just inbox preview stale until the next message).

## 7. Schema validation

**F-DB-16 (Low)** — `Message.ts:41` `attachments` array has no max-length cap. `User.ts:53,64` `blockedUserIds`/`interests` have no count cap (only per-item string length). `DirectoryContact.ts:19-28` `reports` embedded array uncapped. **Fix:** add array-length caps (e.g. 100 blocked users, 15 interests) at the validation layer — also closes part of F-DB-08's root cause. Effort: 1 day.

Everything else — enums, `required`, `maxlength`, numeric `min`/`max` — is applied consistently and thoughtfully across all 34 models; this is the schema layer's strongest area.

## 8. Large documents / embedding vs referencing

No model embeds a genuinely unbounded array of another entity's full documents — `Message` is correctly its own collection referencing `scopeId` rather than embedded in `Channel`/`Conversation` (avoiding the classic 16MB blowup). `Booking.reminders`, `Message.reactions`, `Channel.pinnedMessageIds`, `User.loginAttempts` (self-trimming) are all naturally bounded. The only unbounded-array risks are the ones in F-DB-16, all Low severity since none can realistically reach the 16MB document limit, just degrade index efficiency.

## 9. Duplicate data / denormalization risk

**F-DB-17 (Medium)** — `backend/src/models/User.ts:16-24` — `collegeCategory` (legacy enum) vs `collegeCategoryId` (FK) are explicitly documented as "best-effort mapping kept in sync" via `userService.LEGACY_COLLEGE_CATEGORY_MAP`. This is intentional migration debt; any write path that updates one without the other creates permanently divergent classification for that user, which several checklist-generation and admin-filter paths key off. Worth a follow-up grep on every write-site. Effort: 1 week.

**Positive:** `UserChecklist` deliberately references `DefaultChecklistItem` at read time rather than duplicating title/price/brand — a well-reasoned design avoiding exactly this class of risk.

## 10. Connection handling

**F-DB-18 (Medium-High)** — `backend/src/db.ts:18` — `mongoose.connect(MONGODB_URI)` with **no options** — no `maxPoolSize`, `minPoolSize`, `serverSelectionTimeoutMS`, `socketTimeoutMS`. Driver default `maxPoolSize` is 100 per Mongoose connection/process. **Why:** at 1M+ users with multiple horizontally-scaled instances, each independently opens up to 100 connections — 10 instances = 1,000 concurrent connections against an Atlas tier that caps in the low hundreds to ~1,500 (M10/M20), risking pool exhaustion. **Fix:** explicitly set pool size and timeouts, tuned against the Atlas tier's connection ceiling divided by expected instance count. Effort: 1 day.

**F-DB-19 (Low)** — No `mongoose.connection.on('error'|'disconnected'|'reconnected')` listeners — connection issues surface only as ad hoc request failures. Effort: 1 day.

**Confirmed non-issue:** `connectDB()` is called inside `requireAuth`/`optionalAuth` on every request (`middleware/auth.ts:28,55`) — this is **safe and idiomatic**, since `db.ts` caches the resolved connection and returns it immediately on subsequent calls. The only real gap is no reconnection-detection logic (F-DB-19), not the per-request call pattern itself.

## Summary table

| # | Finding | Severity |
|---|---|---|
| F-DB-11 | `.distinct()` on AnalyticsEvent can exceed Mongo's 16MB limit | Critical |
| F-DB-01 | Non-anchored regex user search = full collection scan | Critical |
| F-DB-12 | Raw event rows pulled into Node instead of aggregated | High |
| F-DB-08 | Sequential unbounded N+1 in community auto-join | High |
| F-DB-09 | N+1 unread-count queries per conversation | High |
| F-DB-18 | No pool-size/timeout config on mongoose.connect | Medium-High |
| F-DB-14 | Community.memberCount drift risk (no transaction) | Medium-High |
| F-DB-10 | Unbounded per-user list queries, sum computed in Node | Medium |
| F-DB-13 | No caching for repeated analytics aggregations | Medium |
| F-DB-06 | OtpVerification resend race (no DB-level guard) | Medium |
| F-DB-17 | User.collegeCategory/collegeCategoryId dual-write drift | Medium |
| F-DB-02 | Missing {mobile,purpose,createdAt} compound index | Medium |
| F-DB-15 | Conversation.lastMessageAt drift risk (no transaction) | Low |
| F-DB-04 | Redundant memberIds index doubling write cost | Low |
| F-DB-16 | Unbounded arrays (attachments, interests, reports) | Low |
| F-DB-19 | No connection-event monitoring | Low |

**Rating: Database layer 6.5/10.** Schema design and unique constraints are genuinely strong; the gap is entirely in the analytics/aggregation layer (raw `.find()`+JS reduction instead of Mongo aggregation) and the missing connection-pool tuning — both fixable without a schema migration.
