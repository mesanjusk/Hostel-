import type { ProductCategory } from "@/types";

export interface AdminProductDTO {
  id: string;
  name: string;
  imageUrl: string | null;
  category: ProductCategory;
  store: string;
  price: number;
  discountPercent: number;
  rating: number;
  pros: string[];
  cons: string[];
  buyLinks: {
    amazon: string | null;
    flipkart: string | null;
    myntra: string | null;
    decathlon: string | null;
    local: string | null;
  };
  budgetAlternative: string | null;
  premiumAlternative: string | null;
  featured: boolean;
}

/** Raw shape returned by GET /api/products (populated alternatives as full objects). */
export interface AdminProductRaw {
  _id: string;
  name: string;
  imageUrl?: string | null;
  category: ProductCategory;
  store: string;
  price: number;
  discountPercent: number;
  rating: number;
  pros: string[];
  cons: string[];
  buyLinks?: {
    amazon?: string | null;
    flipkart?: string | null;
    myntra?: string | null;
    decathlon?: string | null;
    local?: string | null;
  };
  budgetAlternative: { _id: string } | null;
  premiumAlternative: { _id: string } | null;
  featured: boolean;
}

export function toAdminProductDTO(raw: AdminProductRaw): AdminProductDTO {
  return {
    id: raw._id,
    name: raw.name,
    imageUrl: raw.imageUrl ?? null,
    category: raw.category,
    store: raw.store,
    price: raw.price,
    discountPercent: raw.discountPercent,
    rating: raw.rating,
    pros: raw.pros,
    cons: raw.cons,
    buyLinks: {
      amazon: raw.buyLinks?.amazon ?? null,
      flipkart: raw.buyLinks?.flipkart ?? null,
      myntra: raw.buyLinks?.myntra ?? null,
      decathlon: raw.buyLinks?.decathlon ?? null,
      local: raw.buyLinks?.local ?? null,
    },
    budgetAlternative: raw.budgetAlternative?._id ?? null,
    premiumAlternative: raw.premiumAlternative?._id ?? null,
    featured: raw.featured,
  };
}
