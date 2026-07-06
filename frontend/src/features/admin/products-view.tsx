import { useState } from "react";
import { ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ProductFormDialog } from "@/features/admin/product-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { AdminProductDTO } from "@/features/admin/product-dto";

export function ProductsView({ products: initialProducts }: { products: AdminProductDTO[] }) {
  const [products, setProducts] = useState(initialProducts);

  async function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.delete(`/api/admin/products/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete product");
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Shopping recommendations shown to students"
        action={<ProductFormDialog products={products} />}
      />

      {products.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No products yet" description="Add your first shopping recommendation." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.store}</TableCell>
                  <TableCell>₹{product.price.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Star className="fill-warning text-warning size-3.5" />
                      {product.rating.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>{product.featured ? <Badge variant="accent">Featured</Badge> : "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <ProductFormDialog
                        products={products}
                        product={product}
                        trigger={
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        }
                      />
                      <ConfirmDialog
                        trigger={
                          <Button variant="outline" size="sm">
                            Delete
                          </Button>
                        }
                        title="Delete this product?"
                        description="Students will no longer see this recommendation."
                        onConfirm={() => handleDelete(product.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
