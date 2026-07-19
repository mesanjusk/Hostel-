import { CONFIGURABLE_NAV_ITEMS, HOME_ROUTE, type NavItem } from "@/lib/nav-items";

export type NavPlacement = "bottom" | "overflow";

export interface NavLayoutEntry {
  id: string;
  visible: boolean;
  placement: NavPlacement;
  order: number;
}

/** Physical limit of the mobile bottom tab bar: 2 slots either side of the center FAB. An
 * admin can't assign more than this many items to "Bottom bar" — resolveNavLayout also
 * enforces it defensively at render time in case saved data ever has more (demoting the
 * overflow to the 3-dot menu rather than breaking the bar's layout). */
export const MAX_BOTTOM_ITEMS = 4;

/** Nav items hidden by default until an admin turns them back on from the "Nav items"
 * admin editor. */
const INITIALLY_HIDDEN_HREFS = new Set([
  "/budget",
  "/wishlist",
  "/documents",
  "/shopping",
  "/notes",
  "/contacts",
]);

/** The bottom tab bar's shape before any admin ever customizes it — Home, Checklist,
 * Community, Discover, in that order. Everything else in CONFIGURABLE_NAV_ITEMS defaults to
 * the overflow menu, in its declared order. */
const DEFAULT_BOTTOM_HREFS = [HOME_ROUTE, "/checklist", "/community", "/discover"];

export const DEFAULT_NAV_LAYOUT: NavLayoutEntry[] = (() => {
  const bottomHrefs = DEFAULT_BOTTOM_HREFS.filter((href) => CONFIGURABLE_NAV_ITEMS.some((i) => i.href === href));
  let overflowIndex = 0;
  return CONFIGURABLE_NAV_ITEMS.map((item) => {
    const bottomIndex = bottomHrefs.indexOf(item.href);
    if (bottomIndex !== -1) {
      return { id: item.href, visible: true, placement: "bottom" as const, order: bottomIndex };
    }
    return {
      id: item.href,
      visible: !INITIALLY_HIDDEN_HREFS.has(item.href),
      placement: "overflow" as const,
      order: overflowIndex++,
    };
  });
})();

export function navItemLabel(href: string): string {
  return CONFIGURABLE_NAV_ITEMS.find((item) => item.href === href)?.label ?? href;
}

/** A layout entry as it comes back from the API — only `id`/`visible` are guaranteed (that's
 * all the dashboard/home-card layouts ever save through this same shared storage shape), so
 * placement/order are optional here even though NavLayoutEntry requires them once merged. */
export interface SavedNavWidget {
  id: string;
  visible: boolean;
  placement?: NavPlacement | null;
  order?: number | null;
}

/** The floating quick-add ("+") button isn't a route — it doesn't belong in
 * CONFIGURABLE_NAV_ITEMS/the bottom-bar-vs-overflow system, it just needs a visible/hidden
 * toggle. Stored as one extra entry in the same saved `widgets` array (everything else here
 * ignores ids it doesn't recognize) rather than adding a whole separate admin endpoint for a
 * single boolean. */
export const FAB_NAV_ID = "fab";
export const DEFAULT_FAB_VISIBLE = true;

export function resolveFabVisible(saved: SavedNavWidget[] | null | undefined): boolean {
  const entry = saved?.find((w) => w.id === FAB_NAV_ID);
  return entry ? entry.visible : DEFAULT_FAB_VISIBLE;
}

/** Merges an admin-saved nav layout onto the current CONFIGURABLE_NAV_ITEMS set: known ids
 * keep their saved visibility/placement/order, falling back to the default placement/order
 * for a saved entry that predates this feature (only had `visible`). Any nav item that exists
 * now and wasn't in the saved data (a new feature shipped after a layout was last saved) is
 * appended with its default placement/order instead of silently disappearing — this is
 * exactly the bug that made Community/Messages vanish from the "Nav items" editor earlier.
 * Saved entries for hrefs that no longer exist are dropped. */
export function mergeNavLayout(saved: SavedNavWidget[] | null | undefined): NavLayoutEntry[] {
  if (!saved || saved.length === 0) return DEFAULT_NAV_LAYOUT;

  const savedById = new Map(saved.map((w) => [w.id, w]));
  const defaultById = new Map(DEFAULT_NAV_LAYOUT.map((e) => [e.id, e]));

  return CONFIGURABLE_NAV_ITEMS.map((item) => {
    const savedEntry = savedById.get(item.href);
    const fallback = defaultById.get(item.href)!;
    if (!savedEntry) return fallback;
    return {
      id: item.href,
      visible: savedEntry.visible,
      placement: savedEntry.placement ?? fallback.placement,
      order: savedEntry.order ?? fallback.order,
    };
  });
}

export interface ResolvedNavLayout {
  bottomItems: NavItem[];
  overflowItems: NavItem[];
  /** Bottom items followed by overflow items — what the desktop sidebar renders, since it
   * has no bottom-bar/overflow-menu distinction, just one ordered list. */
  allOrderedItems: NavItem[];
  fabVisible: boolean;
}

function toNavItem(entry: NavLayoutEntry): NavItem | null {
  return CONFIGURABLE_NAV_ITEMS.find((item) => item.href === entry.id) ?? null;
}

/** Turns a merged layout into what every nav surface actually renders: visible-only, sorted
 * by the admin's chosen order, split into bottom-bar vs overflow-menu groups (with the
 * MAX_BOTTOM_ITEMS cap enforced here too, not just in the editor UI, so malformed/stale saved
 * data can never overflow the tab bar's fixed 4 slots). */
export function resolveNavLayout(saved: SavedNavWidget[] | null | undefined): ResolvedNavLayout {
  const merged = mergeNavLayout(saved);
  const visible = merged.filter((e) => e.visible);
  const sortedBottom = visible.filter((e) => e.placement === "bottom").sort((a, b) => a.order - b.order);
  const declaredOverflow = visible.filter((e) => e.placement === "overflow").sort((a, b) => a.order - b.order);

  // Defensive cap — spillover keeps the item reachable (via the 3-dot menu) instead of
  // dropping it outright if saved data somehow has more than 4 bottom-placed items.
  const bottomEntries = sortedBottom.slice(0, MAX_BOTTOM_ITEMS);
  const spillover = sortedBottom.slice(MAX_BOTTOM_ITEMS);

  const bottomItems = bottomEntries.map(toNavItem).filter((i): i is NavItem => i !== null);
  const overflowItems = [...spillover, ...declaredOverflow].map(toNavItem).filter((i): i is NavItem => i !== null);

  return {
    bottomItems,
    overflowItems,
    allOrderedItems: [...bottomItems, ...overflowItems],
    fabVisible: resolveFabVisible(saved),
  };
}
