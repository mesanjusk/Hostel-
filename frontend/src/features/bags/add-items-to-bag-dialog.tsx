import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CategorySelect } from "@/features/checklist/category-select";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import {
  toChecklistItemDTO,
  type ChecklistItemDTO,
  type ChecklistItemRaw,
} from "@/features/checklist/checklist-item-dto";

interface AddItemsToBagDialogProps {
  bagId: string;
  categories: string[];
  trigger: React.ReactNode;
}

/** "Add Item" from inside a bag: pick a category, then either check off items that
 * category already has on the checklist (moving them into this bag) or type a brand-new
 * item name to create one directly assigned here. No priority field — packing into a
 * bag doesn't need it, unlike the main checklist form. */
export function AddItemsToBagDialog({ bagId, categories, trigger }: AddItemsToBagDialogProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [categoryList, setCategoryList] = useState(categories);
  const [items, setItems] = useState<ChecklistItemDTO[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setCategoryList(categories);
  }, [categories]);

  useEffect(() => {
    if (!open) return;
    setCategory(categories[0] ?? "");
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function fetchItems() {
    try {
      const { categories: grouped } = await api.get<{
        categories: { category: string; items: ChecklistItemRaw[] }[];
      }>("/api/checklist");
      setItems(grouped.flatMap((g) => g.items.map(toChecklistItemDTO)));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load items");
      setItems([]);
    }
  }

  const itemsInCategory = (items ?? []).filter((i) => i.category === category);

  async function toggleAssign(item: ChecklistItemDTO) {
    const isInThisBag = item.bagId === bagId;
    setPendingId(item.id);
    setItems((prev) =>
      (prev ?? []).map((i) => (i.id === item.id ? { ...i, bagId: isInThisBag ? null : bagId } : i)),
    );
    try {
      await api.patch(`/api/checklist/${item.id}`, { bagId: isInThisBag ? null : bagId });
      emitRefresh();
      toast.success(isInThisBag ? `Removed ${item.item}` : `Added ${item.item}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update item");
      await fetchItems();
    } finally {
      setPendingId(null);
    }
  }

  async function handleCreateNew() {
    const name = newName.trim();
    if (!name) return;
    if (!category) {
      toast.error("Choose a category first");
      return;
    }
    setCreating(true);
    try {
      await api.post("/api/checklist", {
        item: name,
        category,
        priority: "medium",
        bagId,
      });
      emitRefresh();
      toast.success(`${name} added`);
      setNewName("");
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add item");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add items to this bag</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Category</p>
            <CategorySelect
              categories={categoryList}
              value={category}
              onChange={setCategory}
              onCategoryCreated={(c) => setCategoryList((prev) => [...prev, c])}
            />
          </div>

          {category && (
            <>
              <div>
                <p className="mb-1.5 text-sm font-medium">Items in {category}</p>
                {items === null ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="text-muted-foreground size-4 animate-spin" />
                  </div>
                ) : itemsInCategory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No items in this category yet.</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto rounded-xl border">
                    {itemsInCategory.map((item) => {
                      const isInThisBag = item.bagId === bagId;
                      return (
                        <label
                          key={item.id}
                          className="hover:bg-muted/50 flex items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0"
                        >
                          <Checkbox
                            checked={isInThisBag}
                            disabled={pendingId === item.id}
                            onCheckedChange={() => toggleAssign(item)}
                          />
                          <span className="min-w-0 flex-1 truncate">{item.item}</span>
                          {pendingId === item.id && (
                            <Loader2 className="text-muted-foreground size-3.5 shrink-0 animate-spin" />
                          )}
                          {!isInThisBag && item.bagName && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              in {item.bagName}
                            </Badge>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <p className="mb-2 text-sm font-medium">Add a new item</p>
                <div className="flex gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Item name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateNew();
                      }
                    }}
                  />
                  <Button onClick={handleCreateNew} disabled={creating} className="shrink-0">
                    {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    Add
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
