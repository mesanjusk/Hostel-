import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, peekCache } from "@/lib/api";
import { ShoppingView } from "@/features/shopping/shopping-view";
import { toProductDTO, type ProductDTO, type ProductRaw } from "@/features/shopping/product-dto";

const PRODUCTS_PATH = "/api/products";

export default function ShoppingPage() {
  const cachedProducts = peekCache<{ products: ProductRaw[] }>(PRODUCTS_PATH);
  const [products, setProducts] = useState<ProductDTO[]>(() => cachedProducts?.products.map(toProductDTO) ?? []);
  const [loading, setLoading] = useState(() => !cachedProducts);

  useEffect(() => {
    api
      .get<{ products: ProductRaw[] }>(PRODUCTS_PATH)
      .then(({ products }) => setProducts(products.map(toProductDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return <ShoppingView products={products} />;
}
