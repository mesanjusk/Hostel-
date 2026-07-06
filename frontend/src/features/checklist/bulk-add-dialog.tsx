import { useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { CategorySelect } from "@/features/checklist/category-select";
import { CHECKLIST_PRIORITIES, type ChecklistPriority } from "@/types";

export function BulkAddDialog({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [categoryList, setCategoryList] = useState(categories);
  const [category, setCategory] = useState(categories[0] ?? "");
  const [priority, setPriority] = useState<ChecklistPriority>("medium");
  const [namesText, setNamesText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const names = namesText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) {
      toast.error("Add at least one item name");
      return;
    }
    if (!category) {
      toast.error("Pick a category");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.post<{ count: number; skipped: number }>(
        "/api/checklist/bulk-create",
        { category, priority, names },
      );
      emitRefresh();

      if (result.count === 0) {
        toast.info("Those items already exist in this category");
      } else {
        toast.success(
          `Added ${result.count} item${result.count === 1 ? "" : "s"}` +
            (result.skipped > 0 ? ` (${result.skipped} already existed)` : ""),
        );
      }
      setNamesText("");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Layers className="size-4" />
          Bulk add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk add items</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <CategorySelect
                categories={categoryList}
                value={category}
                onChange={setCategory}
                onCategoryCreated={(c) => setCategoryList((prev) => [...prev, c])}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ChecklistPriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECKLIST_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Item names (one per line)</Label>
            <Textarea
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
              rows={6}
              placeholder={"Bedsheet set\nPillow\nMosquito net"}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Add items
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
