# 12 — Unused Packages

**Method:** every dependency and devDependency in both `package.json` files was grepped against its corresponding `src` tree for at least one import reference.

## Backend (`backend/package.json`)

All 14 dependencies and all 10 devDependencies are confirmed used:

| Package | Evidence |
|---|---|
| `bcryptjs` | `lib/pin.ts` |
| `cloudinary` | `lib/cloudinary.ts` |
| `compression` | `index.ts:3,60` |
| `cors` | `index.ts:4,83` |
| `dotenv` | `index.ts:1` |
| `express` | throughout |
| `express-rate-limit` | `index.ts:7,123`, several routes |
| `geoip-lite` | `lib/geo.ts` |
| `helmet` | `index.ts:6,65` |
| `jsonwebtoken` | `lib/jwt.ts` |
| `mongoose` | 46 files |
| `socket.io` | `lib/socket.ts` |
| `ua-parser-js` | `lib/userAgent.ts` |
| `zod` | 22 files |
| devDeps (`@types/*`, `tsc-alias`, `tsx`, `typescript`) | build/dev scripts |

**Verdict: KEEP ALL — no unused backend dependencies.**

## Frontend (`frontend/package.json`)

All 39 dependencies/devDependencies are confirmed used with ≥1 import, **except one:**

### F-PKG-01 (Low) — `@radix-ui/react-tooltip` is unused
**Evidence:** `grep -rn "TooltipProvider|TooltipTrigger|TooltipContent" frontend/src --include=*.tsx | grep -v components/ui/tooltip.tsx` → 0 results. The wrapper `frontend/src/components/ui/tooltip.tsx` is itself never imported anywhere (`grep -rn "@/components/ui/tooltip" frontend/src` → 0 results). The only other "Tooltip" hits in the codebase are recharts' unrelated `<Tooltip>` component in `budget-view.tsx`/`expense-mini-chart.tsx`.
**Verdict:** SAFE TO DELETE (dependency + `components/ui/tooltip.tsx`), unless intentionally retained as an unused shadcn/ui scaffold primitive for near-term use. Effort: 1 day. (Duplicated finding, see `10-Dead-Code.md` F-DEAD-01.)

### Confirmed used (traced to ≥1 wrapper/feature file each — listed for completeness since these were explicitly checked, not assumed)

`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (welcome canvas drag-and-drop), `@hookform/resolvers` (every form dialog), `@radix-ui/react-{accordion,avatar,checkbox,dialog,dropdown-menu,label,popover,progress,radio-group,scroll-area,select,separator,slot,switch,tabs}` (each traces to one `components/ui/*` wrapper, each wrapper consumed by multiple feature files), `@react-three/drei` + `@react-three/fiber` + `three` (bags 3D suitcase feature), `class-variance-authority` + `clsx` + `tailwind-merge` (`lib/utils.ts` cn() helper), `cmdk` (global search command palette), `date-fns` (date formatting across bookings/checklist/analytics), `framer-motion` (animations throughout), `jspdf` + `jspdf-autotable` (checklist PDF export, dynamically imported), `lottie-react` (success animations), `lucide-react` (icons throughout), `qrcode.react` (bag QR dialog), `react-hook-form` (every form), `react-moveable` (admin home-screen editor), `react-router-dom` (routing), `recharts` (dashboard/budget charts), `socket.io-client` (`lib/socket.ts`), `sonner` (toasts), `tw-animate-css` (Tailwind animation utilities), `zod` (every validation schema).

Dev dependencies (`@eslint/js`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`, `@tailwindcss/postcss`, `tailwindcss`, `@types/*`, `@vitejs/plugin-react`, `vite`) are all active build/lint tooling.

## Summary table

| # | Finding | Severity |
|---|---|---|
| F-PKG-01 | `@radix-ui/react-tooltip` unused (frontend) | Low |

**Rating: Unused Packages 9.5/10.** Out of 53 total dependencies across both projects, exactly one is unused. This is an exceptionally clean dependency graph for a codebase this size.
