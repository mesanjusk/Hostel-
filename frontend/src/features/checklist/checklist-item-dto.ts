import type { ChecklistCategory, ChecklistPriority, StoreOption } from "@/types";

export interface ChecklistItemDTO {
  id: string;
  category: ChecklistCategory;
  item: string;
  description: string;
  imageUrl: string | null;
  bagId: string | null;
  bagName: string | null;
  bagColor: string | null;
  notes: string;
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

/** Raw shape returned by the API (Mongo doc with `_id`). */
export interface ChecklistItemRaw {
  _id: string;
  category: ChecklistCategory;
  item: string;
  description?: string;
  imageUrl?: string | null;
  bagId?: string | null;
  bagName?: string | null;
  bagColor?: string | null;
  notes?: string;
  completed: boolean;
  priority: ChecklistPriority;
  price?: number | null;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  recommendedBrand?: string | null;
  recommendedStore?: StoreOption | null;
  purchaseLink?: string | null;
  studentRating?: number | null;
  importance?: string;
}

export function toChecklistItemDTO(raw: ChecklistItemRaw): ChecklistItemDTO {
  return {
    id: raw._id,
    category: raw.category,
    item: raw.item,
    description: raw.description ?? "",
    imageUrl: raw.imageUrl ?? null,
    bagId: raw.bagId ? String(raw.bagId) : null,
    bagName: raw.bagName ?? null,
    bagColor: raw.bagColor ?? null,
    notes: raw.notes ?? "",
    completed: raw.completed,
    priority: raw.priority,
    price: raw.price ?? null,
    priceRangeMin: raw.priceRangeMin ?? null,
    priceRangeMax: raw.priceRangeMax ?? null,
    recommendedBrand: raw.recommendedBrand ?? null,
    recommendedStore: raw.recommendedStore ?? null,
    purchaseLink: raw.purchaseLink ?? null,
    studentRating: raw.studentRating ?? null,
    importance: raw.importance ?? "",
  };
}
