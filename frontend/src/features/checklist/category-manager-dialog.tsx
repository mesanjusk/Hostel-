import { useEffect, useState } from "react";
import { FolderCog, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";

interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
}

interface CategoryManagerDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CategoryManagerDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: CategoryManagerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [moveTargetFor, setMoveTargetFor] = useState<{ id: string; itemCount: number } | null>(null);
  const [moveTargetId, setMoveTargetId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    api
      .get<{ categories: CategoryRow[] }>("/api/categories")
      .then(({ categories }) => setRows(categories))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load categories"))
      .finally(() => setIsLoading(false));
  }, [open]);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;

    setIsSubmitting(true);
    try {
      await api.post("/api/categories", { name });
      toast.success("Category added");
      setNewName("");
      const { categories } = await api.get<{ categories: CategoryRow[] }>("/api/categories");
      setRows(categories);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRename(id: string) {
    const name = editingName.trim();
    if (!name) return;

    setIsSubmitting(true);
    try {
      await api.patch(`/api/categories/${id}`, { name });
      toast.success("Category renamed");
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
      setEditingId(null);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to rename category");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, moveItemsTo?: string) {
    setIsSubmitting(true);
    try {
      await api.delete(`/api/categories/${id}`, moveItemsTo ? { moveItemsTo } : undefined);
      toast.success("Category deleted");
      setRows((prev) => prev.filter((r) => r.id !== id));
      setMoveTargetFor(null);
      setMoveTargetId("");
      emitRefresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const data = error.data as { itemCount?: number } | undefined;
        setMoveTargetFor({ id, itemCount: data?.itemCount ?? 0 });
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderCog className="size-4" />
            Manage categories
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button type="button" size="sm" onClick={handleAdd} disabled={isSubmitting}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>

        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {isLoading && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading categories…
            </div>
          )}
          {!isLoading &&
            rows.map((row) => (
              <div key={row.id} className="flex flex-col gap-2">
                <div className="hover:bg-muted flex items-center gap-2 rounded-lg px-2 py-1.5">
                  {editingId === row.id ? (
                    <>
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleRename(row.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => handleRename(row.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm">{row.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        aria-label="Rename category"
                        onClick={() => {
                          setEditingId(row.id);
                          setEditingName(row.name);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive size-8"
                        aria-label="Delete category"
                        onClick={() => handleDelete(row.id)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>

                {moveTargetFor?.id === row.id && (
                  <div className="bg-muted mx-2 flex flex-col gap-2 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">
                      {moveTargetFor.itemCount} item(s) in this category — move them to:
                    </p>
                    <div className="flex items-center gap-2">
                      <Select value={moveTargetId} onValueChange={setMoveTargetId}>
                        <SelectTrigger size="sm" className="flex-1">
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {rows
                            .filter((r) => r.id !== row.id)
                            .map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!moveTargetId || isSubmitting}
                        onClick={() => handleDelete(row.id, moveTargetId)}
                      >
                        Move &amp; delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
