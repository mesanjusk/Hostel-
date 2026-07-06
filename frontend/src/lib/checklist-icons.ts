import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Shirt,
  Footprints,
  Laptop,
  Pill,
  Droplets,
  WashingMachine,
  PenTool,
  UtensilsCrossed,
  Building2,
  Scissors,
  Siren,
  Box,
  Layers,
} from "lucide-react";

/** Icons for the 13 default category names. User-created categories fall back to DEFAULT_CATEGORY_ICON. */
export const CHECKLIST_CATEGORY_ICONS: Partial<Record<string, LucideIcon>> = {
  Documents: FileText,
  Clothes: Shirt,
  Footwear: Footprints,
  Electronics: Laptop,
  Medicines: Pill,
  Toiletries: Droplets,
  Laundry: WashingMachine,
  Stationery: PenTool,
  Kitchen: UtensilsCrossed,
  "Hostel Essentials": Building2,
  "Fashion Design Tools": Scissors,
  Emergency: Siren,
  Miscellaneous: Box,
};

export const DEFAULT_CATEGORY_ICON: LucideIcon = Layers;

export function getCategoryIcon(category: string): LucideIcon {
  return CHECKLIST_CATEGORY_ICONS[category] ?? DEFAULT_CATEGORY_ICON;
}
