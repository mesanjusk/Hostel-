import {
  BedDouble,
  BookOpen,
  Compass,
  FileText,
  GraduationCap,
  Heart,
  ListChecks,
  Luggage,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { CommunityIcon } from "@/components/shared/community-icon";

export interface HubCardDef {
  id: string;
  section: string;
  title: string;
  href: string;
  icon: LucideIcon;
}

/** A home-card layout entry as saved through the shared UiLayout storage: `visible` is
 * always present, `order` is the admin-chosen position among the cards (gap-free 0..n-1). */
export interface HubLayoutEntry {
  id: string;
  visible: boolean;
  order: number;
}

/** One card per Welcome-page ("home page after splash") scrapbook section, carried over
 * as a clickable entry point into the matching real app feature — this is the post-login
 * landing hub /wa-login sends people to. Each card has a stable `id` so an admin can
 * independently hide/show it from the "Home Cards" editor. */
export const HUB_CARDS: HubCardDef[] = [
  { id: "checklist", section: "Hero", title: "Checklist", href: "/checklist", icon: ListChecks },
  { id: "survival-guide", section: "Mental Prep", title: "Survival Guide", href: "/guide/survival-guide", icon: BookOpen },
  { id: "bags", section: "Room Setup", title: "Bags", href: "/bags", icon: Luggage },
  { id: "shopping", section: "Survival Hacks", title: "Shopping", href: "/shopping", icon: ShoppingBag },
  { id: "toiletries", section: "Bathroom Reality", title: "Toiletries", href: "/checklist", icon: ListChecks },
  { id: "budget", section: "Food Survival", title: "Budget", href: "/budget", icon: Wallet },
  { id: "discover", section: "Roommate Vibes", title: "Discover", href: "/discover", icon: Users },
  { id: "community", section: "Roommate Vibes", title: "Community", href: "/community", icon: CommunityIcon },
  { id: "wishlist", section: "Underrated Essentials", title: "Wishlist", href: "/wishlist", icon: Heart },
  { id: "documents", section: "Final", title: "Documents", href: "/documents", icon: FileText },
  // Appended rather than slotted next to Discover under "Roommate Vibes", despite belonging
  // there: a card's default order is its index in this array, and mergeHubLayout hands a newly
  // shipped card that default. Inserting mid-array would give it an order an existing saved
  // layout has already assigned to another card, leaving the two to tie. Appending keeps its
  // order past every saved one, so it lands last until an admin positions it.
  { id: "find-a-roomie", section: "Roommate Vibes", title: "Find a Roomie", href: "/find-a-roomie", icon: BedDouble },
  // Appended for the same reason as find-a-roomie above — a fresh card's default order is its
  // array index, so inserting it mid-array would collide with an order a saved layout already
  // assigned elsewhere.
  { id: "explore", section: "Explore", title: "Explore", href: "/explore", icon: Compass },
  // Appended for the same order-collision reason as the two cards above.
  { id: "know-your-campus", section: "Campus Life", title: "Know Your Campus", href: "/know-your-campus", icon: GraduationCap },
];

export const DEFAULT_HUB_LAYOUT: HubLayoutEntry[] = HUB_CARDS.map((card, i) => ({
  id: card.id,
  visible: true,
  order: i,
}));

export function hubCardLabel(id: string): string {
  return HUB_CARDS.find((card) => card.id === id)?.title ?? id;
}

/** A layout entry as it comes back from the API — only `id`/`visible` are guaranteed, so
 * `order` is optional here even though HubLayoutEntry requires it once merged. */
export interface SavedHubWidget {
  id: string;
  visible: boolean;
  order?: number | null;
}

/** Merges an admin-saved layout onto the current card set: known ids keep their saved
 * visibility/order, falling back to the default order for a saved entry that predates this
 * feature (only had `visible`). Any card that exists now and wasn't in the saved data (e.g. a
 * card added after the layout was last saved) is appended with its default order instead of
 * silently vanishing. Saved entries for ids that no longer exist are dropped. */
export function mergeHubLayout(saved: SavedHubWidget[] | null | undefined): HubLayoutEntry[] {
  if (!saved || saved.length === 0) return DEFAULT_HUB_LAYOUT;

  const savedById = new Map(saved.map((w) => [w.id, w]));
  const defaultById = new Map(DEFAULT_HUB_LAYOUT.map((e) => [e.id, e]));

  return HUB_CARDS.map((card) => {
    const savedEntry = savedById.get(card.id);
    const fallback = defaultById.get(card.id)!;
    if (!savedEntry) return fallback;
    return {
      id: card.id,
      visible: savedEntry.visible,
      order: savedEntry.order ?? fallback.order,
    };
  });
}

/** Sorts merged entries by their admin-chosen order — the shape every rendering surface
 * (home hub page, admin editor) should iterate in. */
export function sortedHubLayout(entries: HubLayoutEntry[]): HubLayoutEntry[] {
  return [...entries].sort((a, b) => a.order - b.order);
}

/** Swaps `id` with its neighbor in the given direction and renumbers the whole list to
 * 0..n-1 so order stays gap-free. */
export function moveHubCard(entries: HubLayoutEntry[], id: string, direction: -1 | 1): HubLayoutEntry[] {
  const sorted = sortedHubLayout(entries);
  const index = sorted.findIndex((e) => e.id === id);
  if (index === -1) return entries;

  const swapIndex = index + direction;
  if (swapIndex < 0 || swapIndex >= sorted.length) return entries;

  const reordered = [...sorted];
  [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
  const orderById = new Map(reordered.map((e, i) => [e.id, i]));

  return entries.map((e) => ({ ...e, order: orderById.get(e.id) ?? e.order }));
}
