import type { ChecklistCategory } from "@/types";

export interface AdminProductDTO {
  id: string;
  name: string;
  imageUrl: string | null;
  category: ChecklistCategory;
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
