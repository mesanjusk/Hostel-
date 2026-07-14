import { useState } from "react";
import { ListChecks } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { DefaultChecklistItemFormDialog } from "@/features/admin/default-checklist-item-form-dialog";
import { BulkImportDefaultItemsDialog } from "@/features/admin/bulk-import-default-items-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { CollegeCategoryDTO, CourseDTO } from "@/features/auth/college-taxonomy-dto";
import type { DefaultChecklistItemDTO } from "@/features/admin/default-checklist-item-dto";

export function DefaultChecklistItemsView({
  items,
  total,
  page,
  totalPages,
  search,
  category,
  active,
  categoryOptions,
  collegeCategories,
  courses,
  onSearchChange,
  onCategoryChange,
  onActiveChange,
  onPageChange,
}: {
  items: DefaultChecklistItemDTO[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  category: string;
  active: string;
  categoryOptions: string[];
  collegeCategories: CollegeCategoryDTO[];
  courses: CourseDTO[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onActiveChange: (value: string) => void;
  onPageChange: (page: number) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchDraft, setSearchDraft] = useState(search);

  const categoryNameById = new Map(collegeCategories.map((c) => [c.id, c.name]));

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/admin/default-checklist-items/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete item");
    }
  }

  async function bulkAction(action: "delete" | "activate" | "deactivate") {
    try {
      if (action === "delete") {
        await api.post("/api/admin/default-checklist-items/bulk-delete", { ids: selectedIds });
      } else {
        await api.post("/api/admin/default-checklist-items/bulk-set-active", {
          ids: selectedIds,
          active: action === "activate",
        });
      }
      setSelectedIds([]);
      emitRefresh();
      toast.success(`${selectedIds.length} item(s) updated`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Bulk action failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Default Checklist Items"
        description={`Master catalog — ${total} item(s) — admin-managed, shared by every student's generated checklist`}
        action={
          <div className="flex gap-2">
            <BulkImportDefaultItemsDialog />
            <DefaultChecklistItemFormDialog categories={collegeCategories} courses={courses} />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchChange(searchDraft);
          }}
        >
          <Input
            placeholder="Search title or category…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="w-56"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>

        <Select value={category || "all"} onValueChange={(v) => onCategoryChange(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={active || "all"} onValueChange={(v) => onActiveChange(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Active only</SelectItem>
            <SelectItem value="false">Inactive only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-muted mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkAction("activate")}>
              Activate
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkAction("deactivate")}>
              Deactivate
            </Button>
            <ConfirmDialog
              trigger={
                <Button size="sm" variant="destructive">
                  Delete
                </Button>
              }
              title={`Delete ${selectedIds.length} item(s)?`}
              description="This removes them from the master catalog. Students who already have them keep their existing checklist rows."
              onConfirm={() => bulkAction("delete")}
            />
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={ListChecks} title="No items found" description="Add an item or adjust your filters." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelected(item.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="capitalize">{item.priority}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.isForAllCollegeCategories
                      ? "All categories"
                      : item.applicableCollegeCategories.map((id) => categoryNameById.get(id) ?? "?").join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.analytics
                      ? `${item.analytics.usersUsing} using · ${item.analytics.completionRate}% done`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.active ? "accent" : "outline"}>{item.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <DefaultChecklistItemFormDialog
                        item={item}
                        categories={collegeCategories}
                        courses={courses}
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
                        title="Delete this item?"
                        description="This removes it from the master catalog. Students who already have it keep their existing checklist row."
                        onConfirm={() => handleDelete(item.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="border-border/60 flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
