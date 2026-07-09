import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Copy, ListChecks, Pencil, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { getCategoryIcon } from "@/lib/checklist-icons";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { ChecklistCategory, ChecklistPriority } from "@/types";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";
import { ItemFormDialog } from "@/features/checklist/item-form-dialog";
import { ItemDetailSheet } from "@/features/checklist/item-detail-sheet";
import { QuickRenameDialog } from "@/features/checklist/quick-rename-dialog";
import { AddToBagPopover } from "@/features/bags/add-to-bag-popover";

type PriorityFilter = "all" | ChecklistPriority;
type StatusFilter = "all" | "completed" | "incomplete";
type SortOption = "name" | "price" | "priority";

const PRIORITY_LETTER: Record<ChecklistPriority, string> = {
  low: "L",
  medium: "M",
  high: "H",
};

const PRIORITY_CHIP_CLASS: Record<ChecklistPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
};

const PRIORITY_WEIGHT: Record<ChecklistPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function CategoryView({
  category,
  allCategories,
  initialItems,
  embedded = false,
  hideToolbar = false,
  selectMode: controlledSelectMode,
  selectedIds: controlledSelectedIds,
  onToggleSelected,
}: {
  category: ChecklistCategory;
  allCategories: string[];
  initialItems: ChecklistItemDTO[];
  embedded?: boolean;
  hideToolbar?: boolean;
  selectMode?: boolean;
  selectedIds?: string[];
  onToggleSelected?: (id: string) => void;
}) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [localSelectMode, setLocalSelectMode] = useState(false);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  const [detailItem, setDetailItem] = useState<ChecklistItemDTO | null>(null);
  const [renameItem, setRenameItem] = useState<ChecklistItemDTO | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const isControlled = controlledSelectMode !== undefined;
  const selectMode = isControlled ? controlledSelectMode : localSelectMode;
  const selectedIds = isControlled ? (controlledSelectedIds ?? []) : localSelectedIds;
  const toggleSelected = isControlled
    ? (onToggleSelected ?? (() => {}))
    : (id: string) =>
        setLocalSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const Icon = getCategoryIcon(category);

  const visibleItems = useMemo(() => {
    let list = items;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => i.item.toLowerCase().includes(q));
    }

    if (priorityFilter !== "all") {
      list = list.filter((i) => i.priority === priorityFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((i) => (statusFilter === "completed" ? i.completed : !i.completed));
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === "name") return a.item.localeCompare(b.item);
      if (sortBy === "price") return (a.price ?? 0) - (b.price ?? 0);
      return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    });

    return sorted;
  }, [items, search, priorityFilter, statusFilter, sortBy]);

  function exitSelectMode() {
    if (isControlled) return;
    setLocalSelectMode(false);
    setLocalSelectedIds([]);
  }

  async function toggleCompleted(item: ChecklistItemDTO) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)));
    try {
      await api.patch(`/api/checklist/${item.id}`, { completed: !item.completed });
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update item");
    }
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.delete(`/api/checklist/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete item");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await api.post("/api/checklist/bulk-action", { ids: [id], action: "duplicate" });
      emitRefresh();
      toast.success("Item duplicated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to duplicate item");
    }
  }

  async function runBulkAction(action: "complete" | "incomplete" | "delete" | "duplicate") {
    setBulkLoading(true);
    const ids = selectedIds;

    if (action === "complete" || action === "incomplete") {
      setItems((prev) => prev.map((i) => (ids.includes(i.id) ? { ...i, completed: action === "complete" } : i)));
    } else if (action === "delete") {
      setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
    }

    try {
      await api.post("/api/checklist/bulk-action", { ids, action });
      emitRefresh();

      if (action === "duplicate") {
        toast.success(`${ids.length} item(s) duplicated`);
      } else if (action === "delete") {
        toast.success(`${ids.length} item(s) deleted`);
      } else {
        toast.success(`${ids.length} item(s) marked ${action}`);
      }
      exitSelectMode();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  }

  const toolbar = (
    <div className="flex items-center gap-2">
      <Button
        variant={selectMode ? "secondary" : "outline"}
        size="sm"
        onClick={() => (selectMode ? exitSelectMode() : setLocalSelectMode(true))}
      >
        <ListChecks className="size-4" />
        {selectMode ? "Cancel" : "Select"}
      </Button>
    </div>
  );

  return (
    <div className={embedded ? "" : "pb-24"}>
      {!embedded && (
        <>
          <Link
            to="/checklist"
            className="text-muted-foreground mb-3 inline-flex items-center gap-1 text-sm hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            All categories
          </Link>

          <PageHeader
            title={category}
            description={`${items.filter((i) => i.completed).length} / ${items.length} items packed`}
            action={toolbar}
          />
        </>
      )}

      {embedded && !hideToolbar && <div className="mb-4 flex justify-end">{toolbar}</div>}

      {items.length === 0 ? (
        <EmptyState
          icon={Icon}
          title="No items yet"
          description={`Tap the + button below to add the things you need for ${category.toLowerCase()}.`}
        />
      ) : (
        <>
          {!hideToolbar && (
            <Card className="mb-4 flex-row flex-wrap items-center gap-3 p-4">
              <div className="relative min-w-[180px] flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search items…"
                  className="pl-9"
                />
              </div>

              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
                <SelectTrigger size="sm" className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger size="sm" className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger size="sm" className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort: Name</SelectItem>
                  <SelectItem value="price">Sort: Price</SelectItem>
                  <SelectItem value="priority">Sort: Priority</SelectItem>
                </SelectContent>
              </Select>
            </Card>
          )}

          {visibleItems.length === 0 ? (
            <EmptyState icon={Search} title="No matching items" description="Try adjusting your search or filters." />
          ) : (
            <div className="border-border/60 bg-card divide-border/60 flex flex-col divide-y overflow-hidden rounded-2xl border shadow-sm">
              {visibleItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-muted/50 flex items-center gap-3 px-3 py-2.5"
                >
                  {selectMode ? (
                    <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelected(item.id)} />
                  ) : (
                    <Checkbox checked={item.completed} onCheckedChange={() => toggleCompleted(item)} />
                  )}

                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${PRIORITY_CHIP_CLASS[item.priority]}`}
                    title={`${item.priority} priority`}
                  >
                    {PRIORITY_LETTER[item.priority]}
                  </span>

                  <button
                    type="button"
                    onClick={() => setDetailItem(item)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className={item.completed ? "text-muted-foreground truncate line-through" : "truncate font-medium"}>
                        {item.item}
                      </p>
                      {item.price != null && <p className="text-muted-foreground text-xs">₹{item.price}</p>}
                    </div>
                  </button>

                  {!selectMode && (
                    <div className="flex shrink-0 items-center gap-2">
                      <AddToBagPopover
                        itemId={item.id}
                        bagId={item.bagId}
                        bagName={item.bagName}
                        bagColor={item.bagColor}
                      />

                      <div className="flex shrink-0 items-center gap-1 opacity-60 transition-opacity hover:opacity-100">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label="Edit item">
                              <Pencil className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setRenameItem(item)}>
                              <Pencil className="size-4" />
                              Edit name
                            </DropdownMenuItem>
                            <ItemFormDialog
                              categories={allCategories}
                              category={category}
                              item={item}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <ListChecks className="size-4" />
                                  Edit complete details
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuItem onClick={() => handleDuplicate(item.id)}>
                              <Copy className="size-4" />
                              Duplicate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive size-8"
                              aria-label="Delete item"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          }
                          title="Delete this item?"
                          description="This can't be undone."
                          onConfirm={() => handleDelete(item.id)}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {renameItem && (
        <QuickRenameDialog
          id={renameItem.id}
          currentName={renameItem.item}
          open={renameItem !== null}
          onOpenChange={(open) => !open && setRenameItem(null)}
        />
      )}

      {!isControlled && selectMode && selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-4 bottom-20 z-40 lg:inset-x-auto lg:right-8 lg:bottom-28 lg:left-auto"
        >
          <Card className="flex-row flex-wrap items-center gap-3 p-4 shadow-xl">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => runBulkAction("complete")}>
                <Check className="size-4" />
                Complete
              </Button>
              <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => runBulkAction("incomplete")}>
                <X className="size-4" />
                Incomplete
              </Button>
              <Button size="sm" variant="outline" disabled={bulkLoading} onClick={() => runBulkAction("duplicate")}>
                <Copy className="size-4" />
                Duplicate
              </Button>
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="destructive" disabled={bulkLoading}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                }
                title={`Delete ${selectedIds.length} item(s)?`}
                description="This can't be undone."
                onConfirm={() => runBulkAction("delete")}
              />
            </div>
          </Card>
        </motion.div>
      )}

      <ItemDetailSheet item={detailItem} open={detailItem !== null} onOpenChange={(open) => !open && setDetailItem(null)} />
    </div>
  );
}
