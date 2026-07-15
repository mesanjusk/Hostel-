# 03 — Frontend Review

**Scope:** `frontend/src` — app shell (`App.tsx`, `main.tsx`), auth context, `lib/api.ts`, layouts, ~20 largest feature files, the three.js bags feature, community chat/socket code, welcome canvas/dnd-kit code, and analytics client. React 19.2.4, TypeScript strict mode, Vite 6, TailwindCSS v4, no state-management library, no test framework.

## What's already good (stated up front, since several hypothesized problems turned out not to exist)

- **Route-level code splitting is done correctly.** `App.tsx:13-63` lazy-loads all ~50 page components via `lazy(() => import(...))` inside a single `<Suspense>` (line 78) — this is not an eager-bundle codebase.
- **Zero `: any` / `as any` anywhere in `frontend/src`.** Unusually strong type discipline for ~19k lines across `features/**/*.tsx`.
- **No dead code, no `console.log` calls found** in a 15-file spot check — indicates disciplined authoring/lint enforcement.
- Accessibility is broadly good — `aria-label`s present on nearly every icon-only button; Radix `Dialog` primitives are used consistently instead of hand-rolled modals, so focus-trapping/Escape/ARIA come for free.
- `useEffect` cleanup is correct in most hooks sampled (`use-pwa-install.ts`, `use-media-query.ts`, `slide-container.tsx`, `global-search.tsx`, `pwa-install-prompt.tsx`, ResizeObserver in `home-screen-editor.tsx`).

## Findings

### F-FE-01 (High) — DashboardLayout + 7 form dialogs statically bundled into the eager chunk
**Files:** `frontend/src/App.tsx:6`, `frontend/src/layouts/dashboard-layout.tsx:1-30`, `frontend/src/components/shared/fab-menu.tsx:19-25`.
**Problem:** `DashboardLayout` is a static (non-lazy) import in `App.tsx`. It unconditionally renders `<FabMenu>`, which statically imports **seven** full CRUD dialogs (`ItemFormDialog`, `EntryFormDialog`, `NoteFormDialog`, `DocumentFormDialog`, `ContactFormDialog`, `WishlistFormDialog`, `CategoryManagerDialog`), each with its own `react-hook-form` + `zodResolver` + validation schema.
**Why it matters:** because `DashboardLayout` is eager, all seven forms' worth of validation logic ships in the main chunk loaded by *every* visitor — including anonymous users on `/login` who will never see a dashboard. This inflates first-load JS for the most latency-sensitive, highest-traffic page, undoing the benefit of the lazy page-splitting done everywhere else.
**Solution:** make `DashboardLayout` (and `AuthLayout`) lazy in `App.tsx`, or lazy-load `FabMenu` and defer mounting the 7 dialogs until the user opens the speed-dial. Effort: 1 week.

### F-FE-02 (High) — Service worker is cache-first on hashed assets and index.html with no cache-busting
**File:** `frontend/public/sw.js:1,26-41`.
**Problem:** `CACHE_NAME = "pack-with-me-shell-v1"` is a hardcoded literal with no build-time version bump; the fetch handler is cache-first for every same-origin GET including `/index.html` and the content-hashed JS/CSS bundle files.
**Why it matters:** after a deploy, a returning user with an installed service worker gets served their stale cached `index.html`, which references the *previous* build's hashed asset filenames. Once the new deploy removes the old hashed files from the server (normal Vite behavior), the stale `index.html`'s own script tags 404 — a "broken white screen after every deploy until hard refresh" failure mode. At 1M users, every deploy becomes a wave of broken sessions/support tickets for anyone mid-visit or returning via a cached shell.
**Solution:** inject the Vite build hash into `CACHE_NAME` at build time; switch `index.html`/hashed JS/CSS to network-first or stale-while-revalidate with `skipWaiting`/`clients.claim` + an update-available reload prompt. Effort: 1 week.

### F-FE-03 (High) — Per-row Dialog + react-hook-form mounting on unbounded lists
**Files:** `frontend/src/features/checklist/category-view.tsx:339-349`, `frontend/src/features/admin/users-view.tsx:136-143`, same pattern in `wishlist-view.tsx`, `budget-view.tsx`, `documents-view.tsx`, `notes-view.tsx`, `contacts-view.tsx`.
**Problem:** each list row mounts its own full `<XFormDialog>` (which internally calls `useForm()` with a `zodResolver`) rather than one shared dialog instance driven by "currently editing" state.
**Why it matters:** for a student's checklist/budget/notes list — naturally unbounded and growing over a semester — 150-300 items means 150-300 concurrently-mounted RHF instances on one screen: visible input lag, slow initial render, higher memory use on low-end Android phones (the primary target device for a hostel PWA).
**Solution:** lift dialog state to the parent (`editingItemId`), render one dialog instance whose props switch on selection — the pattern `FabMenu`'s `activeDialog` switch already uses correctly (`fab-menu.tsx:196-224`), just needs to be applied to per-row dialogs too. Effort: 1 month (touches 7 view files).

### F-FE-04 (Medium/High) — Fetch-on-id-change race conditions, inconsistent cancellation
**Files:** `frontend/src/features/community/members-panel.tsx:32-46`, `frontend/src/features/bags/bag-detail-view.tsx:60-75`, and ~50 other id-keyed fetch effects (only 9 of 61+ use a `cancelled` guard, confirmed via grep).
**Problem:** most `useEffect(() => { fetchX() }, [id])` call sites have no cancellation/staleness check, unlike `useChatScope` and `useNavLayout`, which correctly use a `cancelled` flag.
**Why it matters:** on variable mobile networks (this app's actual usage context), a slower stale response can resolve after a newer one and clobber the UI with outdated data when a user navigates quickly between records.
**Solution:** standardize a `cancelled`/`AbortController` guard across all id-keyed fetch effects, ideally via a shared `useAsyncEffect` helper rather than relying on each author remembering it. Effort: 1 week.

### F-FE-05 (Medium) — Ad hoc cache instead of a real data-fetching library
**File:** `frontend/src/lib/api.ts:12-13,137-171`.
**Problem:** no React Query/SWR/Redux/Zustand — a hand-rolled `getCache` (30s TTL Map) plus in-flight GET de-dupe, wholesale-cleared on **any** mutation (`getCache.clear()` on every POST/PUT/PATCH/DELETE, regardless of which resource changed).
**Why it matters:** editing a budget entry invalidates the cached checklist, contacts, wishlist, etc. all at once — more redundant refetches than necessary, no scoped invalidation, no background revalidation-on-focus.
**Solution:** workable at current scale; migrating to TanStack Query would give scoped invalidation, retry/backoff, and devtools visibility as feature surface grows. Effort: 1 month.

### F-FE-06 (Medium) — No manual chunking / bundle visibility in Vite config
**File:** `frontend/vite.config.ts:1-16`.
**Problem:** no `build.rollupOptions.output.manualChunks`, no bundle analyzer plugin, no compression plugin. Heavy, rarely-co-loaded dependencies (`three`+`@react-three/fiber`+`@react-three/drei` ~250kb, `react-moveable` ~40kb, `recharts`, `jspdf`+`jspdf-autotable`) aren't pinned to independently-cacheable vendor chunks.
**Why it matters:** at 1M users, uncontrolled chunk boundaries mean a change to any single feature can invalidate a large shared "everything else" chunk's cache for all returning users.
**Solution:** add explicit `manualChunks` for the heavy libs plus core React/Router; add `rollup-plugin-visualizer` to track bundle composition over time. Effort: 1 week.

### F-FE-07 (Medium) — Duplicated CRUD dialog boilerplate across 9 admin forms
**Files:** `frontend/src/features/admin/{checklist-template,city,college-category,course,default-checklist-item,guide,place,product,user}-form-dialog.tsx` (9 files, 170-406 lines each).
**Problem:** identical boilerplate skeleton in all 9 — local open/isSubmitting state, `buildDefaults()`, `useForm`+`zodResolver`, the same Dialog/Form wiring and try/catch/toast/finally submit shape; only the schema and fields genuinely differ. Already visibly drifted (e.g. `ItemFormDialog` supports controlled+uncontrolled `open`, `PlaceFormDialog` only uncontrolled).
**Solution:** extract a `useCrudFormDialog({schema, buildDefaults, onSubmit, entityName})` hook or generic `<EntityFormDialog>` wrapper — would cut 40-60% of boilerplate across all 9 files. Effort: 1 month. (Cross-referenced in `11-Duplicate-Code.md`.)

### F-FE-08 (Medium) — Most images eager-loaded, no `loading="lazy"`
**Files:** `place-card.tsx:47`, `bag-detail-view.tsx:200-226`, `message-bubble.tsx:21`, `item-detail-sheet.tsx:43-46`, `global-search.tsx:129`.
**Problem:** of 18 `<img>` tags found, only 4 use `loading="lazy"` (`shopping-view.tsx:86-91` does it correctly with `decoding="async"` too).
**Why it matters:** grid views (places/shopping/bag-detail) can render many below-the-fold images; without lazy loading the browser fetches all of them immediately regardless of scroll position — meaningful added network contention on hostel wifi/mobile data.
**Solution:** add `loading="lazy" decoding="async"` to the flagged files; keep it off small above-the-fold logos (`sidebar.tsx:15`, `navbar.tsx:21`) which already specify explicit dimensions. Effort: 1 day.

### F-FE-09 (Medium) — Unlabeled icon-only "More" button
**File:** `frontend/src/features/community/members-panel.tsx:95`.
**Problem:** an icon-only `<Button>` with no `aria-label`, inconsistent with the same "More" trigger correctly labeled elsewhere (`message-bubble.tsx:151`, `aria-label="More"`).
**Solution:** add `aria-label="Member actions"`. Effort: 1 day.

### F-FE-10 (Low) — Auth context value not memoized
**File:** `frontend/src/context/auth-context.tsx:143-160`.
**Problem:** `AuthContext.Provider`'s value is a fresh object literal every render (methods are individually `useCallback`-stabilized, but the object itself isn't memoized).
**Solution:** wrap in `useMemo(() => ({...}), [user, loading, ...])`. Effort: 1 day.

### F-FE-11 (Low) — Typing-indicator timeout not cleared on unmount
**File:** `frontend/src/features/community/use-chat-scope.ts:151-159`.
**Problem:** `notifyTyping`'s `setTimeout` is only re-cleared on the next call, not on unmount/scope-change — a user who types then immediately navigates away leaves a dangling timer that later emits a stray `typing:stop` for an abandoned scope.
**Solution:** return a cleanup from the effect that clears the ref'd timeout. Effort: 1 day.

### F-FE-12 (Low) — Sticker PNGs not compressed
**File:** `frontend/public/stickers/` — 43 PNGs, ~1.8MB total.
**Solution:** convert to WebP/AVIF. Effort: 1 day. (Cross-referenced in `10-Dead-Code.md` — 9 of these are also entirely unreferenced and can be deleted outright.)

## Summary table

| # | Finding | Severity |
|---|---|---|
| F-FE-01 | DashboardLayout + 7 form dialogs statically bundled into eager chunk | High |
| F-FE-02 | Service worker cache-first on hashed assets/index.html, no cache-busting | High |
| F-FE-03 | Per-row Dialog+RHF mounting on unbounded lists | High |
| F-FE-04 | Fetch-on-id-change race conditions, inconsistent cancellation | Medium/High |
| F-FE-05 | Ad hoc cache instead of React Query (whole-cache invalidation) | Medium |
| F-FE-06 | No manual chunking / bundle visualizer in Vite config | Medium |
| F-FE-07 | Duplicated CRUD dialog boilerplate across 9 admin forms | Medium |
| F-FE-08 | Most images eager-loaded, no loading="lazy" | Medium |
| F-FE-09 | Unlabeled icon-only "More" button | Medium |
| F-FE-10 | Auth context value object not memoized | Low |
| F-FE-11 | Typing-indicator timeout not cleared on unmount | Low |
| F-FE-12 | Sticker PNGs not compressed to WebP | Low |

**Rating: Frontend 7/10.** This is the strongest-scoring layer in the audit — route splitting, type discipline, and accessibility are already handled well. The two High findings (service worker cache-busting, eager DashboardLayout) are both concrete, scoped bugs rather than architectural problems, and the per-row-dialog pattern (F-FE-03) is the main structural risk as per-user lists grow.
