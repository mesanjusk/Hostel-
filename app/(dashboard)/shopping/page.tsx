import type { Metadata } from "next";

import { listProducts } from "@/services/productService";
import { toPlain } from "@/lib/serialize";
import { ShoppingView } from "@/features/shopping/shopping-view";
import type { ProductDTO } from "@/features/shopping/product-dto";

export const metadata: Metadata = { title: "Shopping — Hostel Essentials" };

export default async function ShoppingPage() {
  const products = await listProducts();
  const plain = toPlain(products);

  const items: ProductDTO[] = plain.map((p) => ({
    id: p._id,
    name: p.name,
    imageUrl: p.imageUrl ?? null,
    category: p.category,
    store: p.store,
    price: p.price,
    discountPercent: p.discountPercent,
    rating: p.rating,
    pros: p.pros,
    cons: p.cons,
    buyLinks: {
      amazon: p.buyLinks?.amazon ?? null,
      flipkart: p.buyLinks?.flipkart ?? null,
      myntra: p.buyLinks?.myntra ?? null,
      decathlon: p.buyLinks?.decathlon ?? null,
      local: p.buyLinks?.local ?? null,
    },
    budgetAlternative: p.budgetAlternative
      ? {
          id: p.budgetAlternative._id,
          name: p.budgetAlternative.name,
          price: p.budgetAlternative.price,
          store: p.budgetAlternative.store,
        }
      : null,
    premiumAlternative: p.premiumAlternative
      ? {
          id: p.premiumAlternative._id,
          name: p.premiumAlternative.name,
          price: p.premiumAlternative.price,
          store: p.premiumAlternative.store,
        }
      : null,
    featured: p.featured,
  }));

  return <ShoppingView products={items} />;
}
