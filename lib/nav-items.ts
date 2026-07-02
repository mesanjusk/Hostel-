import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  Wallet,
  StickyNote,
  FileText,
  PhoneCall,
  Heart,
  ShoppingBag,
  BookOpen,
  Search,
  UserRound,
  ShieldCheck,
  Settings,
} from "lucide-react";

export { HOME_ROUTE } from "@/lib/routes";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checklist", label: "Checklist", icon: ListChecks },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/contacts", label: "Emergency Contacts", icon: PhoneCall },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/shopping", label: "Shopping", icon: ShoppingBag },
  { href: "/guide/survival-guide", label: "Hostel Guide", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
];

export const PROFILE_NAV_ITEM: NavItem = {
  href: "/profile",
  label: "Profile",
  icon: UserRound,
};

export const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin",
  label: "Admin",
  icon: ShieldCheck,
};

export const SETTINGS_NAV_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};

/** Bottom tab bar: Guide, Checklist, [FAB in the middle], Notes, Shopping. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  PRIMARY_NAV_ITEMS.find((i) => i.href === "/guide/survival-guide")!,
  PRIMARY_NAV_ITEMS.find((i) => i.href === "/checklist")!,
  PRIMARY_NAV_ITEMS.find((i) => i.href === "/notes")!,
  PRIMARY_NAV_ITEMS.find((i) => i.href === "/shopping")!,
];

/** Everything not already reachable from the bottom tab bar — surfaced in the top-right overflow menu. */
export const OVERFLOW_NAV_ITEMS: NavItem[] = PRIMARY_NAV_ITEMS.filter(
  (item) => !BOTTOM_NAV_ITEMS.some((bottomItem) => bottomItem.href === item.href),
);
