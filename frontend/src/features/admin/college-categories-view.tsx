import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { CollegeCategoryFormDialog } from "@/features/admin/college-category-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { CollegeCategoryDTO } from "@/features/auth/college-taxonomy-dto";

export function CollegeCategoriesView({ categories: initialCategories }: { categories: CollegeCategoryDTO[] }) {
  const [categories, setCategories] = useState(initialCategories);

  async function handleDelete(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await api.delete(`/api/admin/college-categories/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete category");
      emitRefresh();
    }
  }

  return (
    <div>
      <PageHeader
        title="College Categories"
        description="Fields of study (Design, Engineering, Medical, ...) used for onboarding and checklist targeting"
        action={<CollegeCategoryFormDialog />}
      />

      {categories.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No categories yet" description="Add your first college category." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{category.description || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={category.active ? "accent" : "outline"}>{category.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <CollegeCategoryFormDialog
                        category={category}
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
                        title="Delete this category?"
                        description="Only possible if no courses, checklist items, or students reference it — otherwise deactivate it instead."
                        onConfirm={() => handleDelete(category.id)}
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
