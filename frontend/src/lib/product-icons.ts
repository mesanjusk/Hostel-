import {
  Bed,
  BedDouble,
  Box,
  Droplets,
  Footprints,
  Frame,
  GlassWater,
  Layers,
  Lightbulb,
  Lock,
  Paperclip,
  PenTool,
  Pin,
  Presentation,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";

/** Icons for shopping recommendations. The catalog deliberately links to store *searches*
 * rather than to specific listings — prices and stock move constantly, and a search always
 * reflects what's actually buyable today — which leaves no single product to photograph. So
 * each item carries an icon instead. Same string-name indirection as lib/guide-icons.ts: the
 * DB stores a name, this maps it to a component, and an unknown name degrades to the generic
 * shopping bag rather than breaking the card. */
export const PRODUCT_ICONS: Record<string, LucideIcon> = {
  Bed,
  BedDouble,
  Box,
  Droplets,
  Footprints,
  Frame,
  GlassWater,
  Layers,
  Lightbulb,
  Lock,
  Paperclip,
  PenTool,
  Pin,
  Presentation,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  WashingMachine,
};

export const DEFAULT_PRODUCT_ICON: LucideIcon = ShoppingBag;

/** Names an admin can pick from in the product editor — the keys above, sorted for a stable
 * dropdown order. */
export const PRODUCT_ICON_NAMES = Object.keys(PRODUCT_ICONS).sort();

export function getProductIcon(name: string | null | undefined): LucideIcon {
  return (name ? PRODUCT_ICONS[name] : undefined) ?? DEFAULT_PRODUCT_ICON;
}
