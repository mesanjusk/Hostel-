import type { Metadata } from "next";

import { listProducts } from "@/services/productService";
import { toPlain } from "@/lib/serialize";
import { ProductsView } from "@/features/admin/products-view";
import type { AdminProductDTO } from "@/features/admin/product-dto";

export const metadata: Metadata = { title: "Products — Admin" };

export default async function AdminProductsPage() {
  const products = await listProducts();
  const plain = toPlain(products);

  const items: AdminProductDTO[] = plain.map((p) => ({
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
    budgetAlternative: p.budgetAlternative?._id ?? null,
    premiumAlternative: p.premiumAlternative?._id ?? null,
    featured: p.featured,
  }));

  return <ProductsView products={items} />;
}
