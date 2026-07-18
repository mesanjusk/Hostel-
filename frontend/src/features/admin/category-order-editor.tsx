import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ListOrdered } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";

function move(list: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Controls the order categories appear in on every student's checklist (notebook + list
 * views) — separate from the item table below, which is unaffected by this. */
export function CategoryOrderEditor() {
  const [categories, setCategories] = useState<string[] | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ categories: string[] }>("/api/admin/default-checklist-items/category-order")
      .then((res) => setCategories(res.categories))
      .catch(() => toast.error("Failed to load category order"));
  }, []);

  function handleMove(index: number, direction: -1 | 1) {
    setCategories((current) => (current ? move(current, index, direction) : current));
    setIsDirty(true);
  }

  async function handleSave() {
    if (!categories) return;
    setIsSaving(true);
    try {
      await api.put("/api/admin/default-checklist-items/category-order", { categories });
      emitRefresh();
      setIsDirty(false);
      toast.success("Category order saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save category order");
    } finally {
      setIsSaving(false);
    }
  }

  if (!categories) return null;

  return (
    <Card className="mb-4">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListOrdered className="size-4" />
          Category order
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
          Save order
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-3 text-sm">
          Controls which category comes first / last on every student's checklist.
        </p>
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">No categories yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {categories.map((category, index) => (
              <div key={category} className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    aria-label={`Move ${category} up`}
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === categories.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    aria-label={`Move ${category} down`}
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
                <span className="text-muted-foreground w-6 shrink-0 text-xs tabular-nums">{index + 1}</span>
                <span className="flex-1 truncate text-sm font-medium">{category}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
