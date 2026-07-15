# 11 — Duplicate Code

**Scope:** both `backend/` and `frontend/`. The codebase has no dead-code problem (see `10-Dead-Code.md`) but does have real, verified duplication in three places.

## F-DUP-01 (Medium) — 9 copy-pasted admin form-dialog components
**Files:** `frontend/src/features/admin/{checklist-template,city,college-category,course,default-checklist-item,guide,place,product,user}-form-dialog.tsx` — 2,202 total lines.
**Problem:** confirmed by direct comparison (e.g. `product-form-dialog.tsx` vs `place-form-dialog.tsx`) — every file repeats the identical skeleton: `useState(open)`/`isSubmitting`, a `buildDefaults()` closure, `useForm`+`zodResolver`, `useEffect(() => form.reset(buildDefaults()), [open])`, `try { patch-or-post } catch { toast.error } finally { setSubmitting(false) }`, `emitRefresh()`. Only the zod schema and field list genuinely differ per entity.
**Why it matters:** any improvement to shared submit/error/loading behavior (optimistic UI, an "unsaved changes" warning, an edge-case fix) must be hand-applied 9 times, and has already visibly drifted — `ItemFormDialog` supports both controlled and uncontrolled `open` state via `isControlled`, while `PlaceFormDialog` only supports uncontrolled.
**Solution:** extract a `useCrudFormDialog({schema, buildDefaults, onSubmit, entityName})` hook or a generic `<CrudFormDialog>` wrapper; each entity file keeps only its schema and fields. Would cut 40-60% of the boilerplate in all 9 files.
**Effort:** 1 month (careful refactor across 9 files + full manual regression pass, since there's no automated test suite).

## F-DUP-02 (Low/Medium) — Drifted `slugify()` reimplemented in two backend services
**Files:** `backend/src/services/courseService.ts`, `backend/src/services/collegeCategoryService.ts` — both define their own local `function slugify(...)` instead of importing the existing shared `backend/src/lib/slug.ts::slugify`.
**Evidence:** `grep -rln "^function slugify" backend/src/services/` → both files. The local copies differ subtly from the shared one — missing the `.slice(0,100)` length cap and the `|| "community"` fallback.
**Why it matters:** this is active drift, not just duplication — course/college-category slugs can behave differently (no length cap, different empty-input fallback) than every other slugified entity (community, city) in the same app.
**Solution:** delete both local copies, import `lib/slug.ts::slugify`. Effort: 1 day.

## F-DUP-03 (Low) — Regex-escaping duplicated 4x instead of using the shared helper
**Files:** `backend/src/services/cityService.ts:26`, `directoryContactService.ts:10`, `placeService.ts:14` (inline `search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`), and `defaultChecklistItemService.ts:311-313` (its own local `escapeRegExp()` doing the identical thing) — all instead of the existing `backend/src/lib/regex.ts::escapeRegex`, which `searchService.ts` and `chatService.ts` correctly use.
**Why it matters:** low risk today, but this is the same class of issue as `08-Security.md` F-SEC-05 (search filters built without the shared escape helper) — four independent copies of a security-relevant string-escaping function is exactly how one of them eventually drifts and reintroduces a ReDoS/regex-injection bug that the other three already avoid.
**Solution:** consolidate all 4 onto `lib/regex.ts::escapeRegex`. Effort: 1 day.

## Related, lower-priority observations

- **`courseService`/`collegeCategoryService`** additionally share a near-identical list/create/update/delete-with-referential-guard shape (uniqueness check on slug, `findByIdAndUpdate`, reference-count guard before delete) — a shared "taxonomy CRUD" base service could remove ~60 duplicated lines. Lower priority than F-DUP-01/02. Effort: 1 week.
- **`admin.routes.ts:165-423`** repeats the same `safeParse → 400 → service call → 400-on-failure → 200` skeleton per-resource roughly 8 times (~150 lines) — this is the backend counterpart to F-DUP-01 and is the direct cause of the status-code inconsistencies documented in `06-API.md` F-API-07/09.
- **`backend/src/lib/phone.ts` and `frontend/src/lib/phone.ts`** are byte-for-byte identical (`normalizeMobile`, `formatMobileForDisplay`, same regex) — confirmed **no drift**. This is expected/intentional duplication given no shared package exists between the two apps; flagged only as the cleanest first candidate if a `packages/common` is ever introduced, not an actionable defect today.

## Summary table

| # | Finding | Severity | Effort |
|---|---|---|---|
| F-DUP-01 | 9 copy-pasted admin form-dialog components | Medium | 1 month |
| F-DUP-02 | Drifted slugify() reimplemented twice | Low/Medium | 1 day |
| F-DUP-03 | Regex-escaping duplicated 4x | Low | 1 day |
| — | admin.routes.ts CRUD skeleton repeated ~8x (backend counterpart of F-DUP-01) | Medium | 1 month |
| — | courseService/collegeCategoryService shared CRUD shape | Low | 1 week |
| — | phone.ts duplicated frontend/backend (no drift, informational) | Info | — |

**Rating: Duplicate Code 6/10.** No duplication was found that causes incorrect behavior today, but the admin form-dialog and admin-route CRUD duplication (F-DUP-01 and its backend counterpart) is a real, growing maintenance liability that already shows early drift.
