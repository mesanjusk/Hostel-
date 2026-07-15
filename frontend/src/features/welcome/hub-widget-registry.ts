import {
  BookOpen,
  FileText,
  Heart,
  ListChecks,
  Luggage,
  ShoppingBag,
  Users,
  Users2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { WidgetConfig } from "@/features/dashboard/widget-registry";

export interface HubCardDef {
  id: string;
  section: string;
  title: string;
  href: string;
  icon: LucideIcon;
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
  { id: "community", section: "Roommate Vibes", title: "Community", href: "/community", icon: Users2 },
  { id: "wishlist", section: "Underrated Essentials", title: "Wishlist", href: "/wishlist", icon: Heart },
  { id: "documents", section: "Final", title: "Documents", href: "/documents", icon: FileText },
];

export const DEFAULT_HUB_LAYOUT: WidgetConfig[] = HUB_CARDS.map((card) => ({
  id: card.id,
  visible: true,
}));

export function hubCardLabel(id: string): string {
  return HUB_CARDS.find((card) => card.id === id)?.title ?? id;
}

/** Merges an admin-saved layout onto the current card set: known ids keep their saved
 * visibility, but any card that exists now and wasn't in the saved data (e.g. a card added
 * after the layout was last saved) is kept visible by default instead of silently vanishing.
 * Saved entries for ids that no longer exist are dropped. */
export function mergeHubLayout(saved: WidgetConfig[] | null | undefined): WidgetConfig[] {
  if (!saved || saved.length === 0) return DEFAULT_HUB_LAYOUT;

  const savedById = new Map(saved.map((w) => [w.id, w]));
  return HUB_CARDS.map((card) => savedById.get(card.id) ?? { id: card.id, visible: true });
}
