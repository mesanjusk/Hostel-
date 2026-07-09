import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { ProductsView } from "@/features/admin/products-view";
import { toAdminProductDTO, type AdminProductDTO, type AdminProductRaw } from "@/features/admin/product-dto";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductDTO[]>([]);

  async function fetchData() {
    try {
      const { products: raw } = await api.get<{ products: AdminProductRaw[] }>("/api/products");
      setProducts(raw.map(toAdminProductDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load products");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <ProductsView products={products} />
    </div>
  );
}
