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
} from "lucide-react";

import type { ChecklistCategory } from "@/types";

export const CHECKLIST_CATEGORY_ICONS: Record<ChecklistCategory, LucideIcon> = {
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
