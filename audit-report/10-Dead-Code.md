# 10 — Dead Code Detection

**Scope:** both `backend/` and `frontend/` — components, pages, utilities, hooks, services, models, npm dependencies, CSS/images. Method: cross-referenced every dependency/export against actual import sites via targeted grep, not assumption.

## Summary verdict

This codebase is **notably clean on dead-route/dead-service fronts** — no unused services, models, pages, or components were found. All 47 backend service files, all 34 model files, all 51 frontend page files, and all 123 feature files trace to at least one real caller/route. The actual production-readiness debt in this area is **duplication** (covered in `11-Duplicate-Code.md`), not unreachable code.

## Findings

### F-DEAD-01 (Low) — Unused Radix Tooltip wrapper + dependency
**Files:** `frontend/src/components/ui/tooltip.tsx`, `@radix-ui/react-tooltip` in `frontend/package.json`.
**Evidence:** `grep -rn "TooltipProvider|TooltipTrigger|TooltipContent" frontend/src --include=*.tsx | grep -v components/ui/tooltip.tsx` → 0 results. `grep -rn "@/components/ui/tooltip" frontend/src` → 0 results. (The only other "Tooltip" hits are recharts' unrelated `<Tooltip>` in `budget-view.tsx`/`expense-mini-chart.tsx`.)
**Verdict:** SAFE TO DELETE — remove the wrapper file and the dependency, unless intentionally kept as an unused shadcn/ui scaffold component for near-term use. Effort: 1 day.

### F-DEAD-02 (Low) — 9 orphaned sticker images
**Files:** `frontend/public/stickers/{2am-maggi,assignment-loading,assignments-due-yesterday,ek-aur-semester-bas,hostel-id-surviving-thriving,hostel-life,progress-not-perfection,roll-no-pending,sleeping-cat}.png`.
**Evidence:** stickers are referenced dynamically via `slug`/`stickerSlug` props and a `STICKER(slug)` helper (`frontend/src/features/welcome/home-elements-default.ts:12`), not literal filenames. Built the full set of referenced slugs from `slug:`, `stickerSlug=`, `STICKER("...")`, and literal `/stickers/*.png` patterns and diffed against the 43 files on disk — these 9 have zero references anywhere in `frontend/src`. Confirmed no admin sticker-picker/manifest exists that could reference them by name (the admin home-screen editor only supports "Add sticker from device" upload).
**Verdict:** SAFE TO DELETE (~300KB total), or intentionally reserve for future guide content. Effort: 1 day.

### F-DEAD-03 (Cosmetic) — Unnecessarily exported internal helper
**File:** `backend/src/lib/referrer.ts` — `classifyReferrer` is exported but only ever called internally by `resolveReferralSource` in the same file (zero external callers via grep).
**Verdict:** NEEDS REVIEW — safe to un-export and make it a private helper, unless intentionally kept exported for direct unit testing (note: no test suite currently exists — see `17-Best-Practices.md`). Effort: 1 day.

## Confirmed NOT dead (checked explicitly, ruled out as false positives)

- **All 47 backend service files** (`backend/src/services/*.ts`) — each imported by ≥1 route file.
- **All 34 backend model files** (`backend/src/models/*.ts`) — each imported by ≥1 service.
- **All 51 frontend page files** (`frontend/src/pages/*.tsx`) — each routed in `App.tsx`.
- **All 123 files under `frontend/src/features/**`** — each has ≥1 external reference. Note: `admin-analytics-dashboard-view.tsx` isn't its own route (the `/admin/analytics-pro` route is a `<Navigate to="/admin"/>` stub) but is rendered inline inside `pages/admin-page.tsx` — not dead, just not directly routed.
- **All exported functions in `backend/src/lib/textSimilarity.ts`, `referrer.ts` (except F-DEAD-03), `userAgent.ts`, `stats.ts`, `dateRange.ts`** — each called from ≥1 service.
- **All 39 frontend npm dependencies except `@radix-ui/react-tooltip`** — see `12-Unused-Packages.md` for the full dependency-by-dependency evidence table.
- **All 14 backend npm dependencies** — all confirmed used.

## Consolidated SAFE TO DELETE list

1. `frontend/src/components/ui/tooltip.tsx` + `@radix-ui/react-tooltip` dependency
2. `frontend/public/stickers/2am-maggi.png`
3. `frontend/public/stickers/assignment-loading.png`
4. `frontend/public/stickers/assignments-due-yesterday.png`
5. `frontend/public/stickers/ek-aur-semester-bas.png`
6. `frontend/public/stickers/hostel-id-surviving-thriving.png`
7. `frontend/public/stickers/hostel-life.png`
8. `frontend/public/stickers/progress-not-perfection.png`
9. `frontend/public/stickers/roll-no-pending.png`
10. `frontend/public/stickers/sleeping-cat.png`

**Rating: Dead Code 9/10.** One of the strongest areas of this codebase — essentially no unreachable code, only a handful of genuinely unused leaf assets.
