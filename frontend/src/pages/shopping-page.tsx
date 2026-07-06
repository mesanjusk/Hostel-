import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { ShoppingView } from "@/features/shopping/shopping-view";
import { toProductDTO, type ProductDTO, type ProductRaw } from "@/features/shopping/product-dto";

export default function ShoppingPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ products: ProductRaw[] }>("/api/products")
      .then(({ products }) => setProducts(products.map(toProductDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return <ShoppingView products={products} />;
}
