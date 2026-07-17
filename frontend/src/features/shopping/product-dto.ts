import type { ProductCategory } from "@/types";

export interface ProductAltDTO {
  id: string;
  name: string;
  price: number;
  store: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  icon: string | null;
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
  budgetAlternative: ProductAltDTO | null;
  premiumAlternative: ProductAltDTO | null;
  featured: boolean;
}

/** Raw shape returned by the API (Mongo doc with `_id`, populated alternatives). */
export interface ProductRaw {
  _id: string;
  name: string;
  icon?: string | null;
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
  budgetAlternative: { _id: string; name: string; price: number; store: string } | null;
  premiumAlternative: { _id: string; name: string; price: number; store: string } | null;
  featured: boolean;
}

export function toProductDTO(raw: ProductRaw): ProductDTO {
  return {
    id: raw._id,
    name: raw.name,
    icon: raw.icon ?? null,
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
    budgetAlternative: raw.budgetAlternative
      ? {
          id: raw.budgetAlternative._id,
          name: raw.budgetAlternative.name,
          price: raw.budgetAlternative.price,
          store: raw.budgetAlternative.store,
        }
      : null,
    premiumAlternative: raw.premiumAlternative
      ? {
          id: raw.premiumAlternative._id,
          name: raw.premiumAlternative.name,
          price: raw.premiumAlternative.price,
          store: raw.premiumAlternative.store,
        }
      : null,
    featured: raw.featured,
  };
}
