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

/** Which of the app's 5 chart hues (see index.css --chart-1..5) each icon's sticker uses,
 * grouped loosely by what the item actually is so nearby categories don't collide. Tailwind
 * needs the full class names written out somewhere it can see them — see PRODUCT_ICON_COLOR_CLASSES. */
const PRODUCT_ICON_COLOR: Record<string, 1 | 2 | 3 | 4 | 5> = {
  Shirt: 1,
  Footprints: 1,
  ShoppingBag: 1,
  Box: 2,
  Paperclip: 2,
  PenTool: 2,
  Layers: 2,
  Droplets: 3,
  GlassWater: 3,
  Lock: 3,
  ShieldCheck: 3,
  WashingMachine: 3,
  Bed: 4,
  BedDouble: 4,
  Frame: 4,
  Pin: 4,
  Lightbulb: 5,
  Presentation: 5,
};

const PRODUCT_ICON_COLOR_CLASSES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "bg-chart-1/15 text-chart-1",
  2: "bg-chart-2/15 text-chart-2",
  3: "bg-chart-3/15 text-chart-3",
  4: "bg-chart-4/15 text-chart-4",
  5: "bg-chart-5/15 text-chart-5",
};

/** Background + text classes for a colored icon "sticker", keyed by the same icon name as
 * getProductIcon. Falls back to the neutral default icon's color for unknown names. */
export function getProductIconColorClasses(name: string | null | undefined): string {
  const key = name && PRODUCT_ICON_COLOR[name] ? name : "ShoppingBag";
  return PRODUCT_ICON_COLOR_CLASSES[PRODUCT_ICON_COLOR[key]];
}
