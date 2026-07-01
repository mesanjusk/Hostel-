import type { ChecklistCategory, ChecklistPriority, StoreOption } from "@/types";

export interface ChecklistItemDTO {
  id: string;
  category: ChecklistCategory;
  item: string;
  description: string;
  imageUrl: string | null;
  completed: boolean;
  priority: ChecklistPriority;
  price: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  recommendedBrand: string | null;
  recommendedStore: StoreOption | null;
  purchaseLink: string | null;
  studentRating: number | null;
  importance: string;
}
