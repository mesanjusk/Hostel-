import { api } from "@/lib/api";

// Mirrors the lazy() imports in App.tsx for every primary nav destination — calling the
// same dynamic import ahead of time warms the browser's module/chunk cache, so React.lazy's
// own import() resolves instantly (no network wait) when the user actually taps the tab.
const PAGE_IMPORTS: Array<() => Promise<unknown>> = [
  () => import("@/pages/dashboard-page"),
  () => import("@/pages/checklist-page"),
  () => import("@/pages/bags-page"),
  () => import("@/pages/budget-page"),
  () => import("@/pages/notes-page"),
  () => import("@/pages/documents-page"),
  () => import("@/pages/contacts-page"),
  () => import("@/pages/wishlist-page"),
  () => import("@/pages/shopping-page"),
  () => import("@/pages/discover-page"),
  () => import("@/pages/explore-page"),
  () => import("@/pages/bookings-page"),
  () => import("@/pages/community-page"),
  () => import("@/pages/chat-page"),
  () => import("@/pages/survival-guide-page"),
  () => import("@/pages/guide-page"),
  () => import("@/pages/settings-page"),
];

// Primary GET each destination's initial render depends on — warms lib/api.ts's response
// cache so the page's own fetch resolves from cache instead of the network on first visit.
const DATA_PATHS = [
  "/api/dashboard",
  "/api/checklist",
  "/api/bags",
  "/api/budget",
  "/api/budget/summary",
  "/api/notes",
  "/api/documents",
  "/api/contacts",
  "/api/wishlist",
  "/api/products",
  "/api/discovery/profile",
  "/api/bookings",
  "/api/guide",
  "/api/categories",
];

let prefetched = false;

/** Warms every primary nav destination's JS chunk and API data once per session, shortly
 * after the dashboard shell mounts — so switching tabs hits an already-downloaded chunk and
 * an already-cached response instead of paying for both on first visit. Errors are swallowed:
 * this is a best-effort background warm-up, not a real page load, so a failure here shouldn't
 * surface a toast for a page the user hasn't even opened. */
export function prefetchNavDestinations() {
  if (prefetched) return;
  prefetched = true;

  const run = () => {
    for (const importPage of PAGE_IMPORTS) {
      importPage().catch(() => {});
    }
    for (const path of DATA_PATHS) {
      api.get(path).catch(() => {});
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run);
  } else {
    setTimeout(run, 1500);
  }
}
