import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Check, Copy, ListChecks, MoreVertical, Search, Trash2, X } from "lucide-react";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { getCategoryIcon } from "@/lib/checklist-icons";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { ChecklistCategory, ChecklistPlanType, ChecklistPriority } from "@/types";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

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
  items,
  onItemsChange,
  embedded = false,
  hideToolbar = false,
  selectMode: controlledSelectMode,
  selectedIds: controlledSelectedIds,
  onToggleSelected,
}: {
  category: ChecklistCategory;
  items: ChecklistItemDTO[];
  // Writes through to whichever parent owns the real checklist state (ChecklistCategoryPage
  // standalone, or ChecklistOverview's per-category slice of ChecklistPage's `groups`), instead
  // of a local copy here. A local copy used to mean an item's first-ever toggle — which
  // materializes it server-side from a virtual template item into a real document with a new id
  // — could leave this component showing stale, pre-materialization data indefinitely: with no
  // effect to resync from props, nothing ever told it the fresh data had arrived. See the same
  // fix already applied to the notebook view (NotebookView / notebook-view.tsx).
  onItemsChange: (updater: (prev: ChecklistItemDTO[]) => ChecklistItemDTO[]) => void;
  embedded?: boolean;
  hideToolbar?: boolean;
  selectMode?: boolean;
  selectedIds?: string[];
  onToggleSelected?: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [localSelectMode, setLocalSelectMode] = useState(false);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ChecklistItemDTO | null>(null);
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
    onItemsChange((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)));
    try {
      await api.patch(`/api/checklist/${item.id}`, { completed: !item.completed });
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update item");
    }
  }

  async function handleDelete(id: string) {
    onItemsChange((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.delete(`/api/checklist/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete item");
    }
  }

  async function handlePlanTypeChange(item: ChecklistItemDTO, planType: ChecklistPlanType | null) {
    onItemsChange((prev) => prev.map((i) => (i.id === item.id ? { ...i, planType } : i)));
    try {
      await api.patch(`/api/checklist/${item.id}`, { planType });
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update item");
    }
  }

  async function runBulkAction(action: "complete" | "incomplete" | "delete" | "duplicate") {
    setBulkLoading(true);
    const ids = selectedIds;

    if (action === "complete" || action === "incomplete") {
      onItemsChange((prev) => prev.map((i) => (ids.includes(i.id) ? { ...i, completed: action === "complete" } : i)));
    } else if (action === "delete") {
      onItemsChange((prev) => prev.filter((i) => !ids.includes(i.id)));
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
                  {/* The checkbox's own box is only 20px — too small to reliably tap on a phone,
                      so a single tap near it often lands just outside and does nothing. This
                      pseudo-element pads the actual hit area out to ~44px (Apple/WCAG's minimum
                      touch target) without changing how big the box looks. */}
                  {selectMode ? (
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={() => toggleSelected(item.id)}
                      className="before:absolute before:-inset-3 before:content-[''] relative"
                    />
                  ) : (
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleCompleted(item)}
                      className="before:absolute before:-inset-3 before:content-[''] relative"
                    />
                  )}

                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${PRIORITY_CHIP_CLASS[item.priority]}`}
                    title={`${item.priority} priority`}
                  >
                    {PRIORITY_LETTER[item.priority]}
                  </span>

                  <div className="min-w-0 flex-1">
                    <span
                      className={
                        item.completed
                          ? "text-muted-foreground block max-w-full truncate line-through"
                          : "block max-w-full truncate font-medium"
                      }
                    >
                      {item.item}
                    </span>
                    {item.price != null && <p className="text-muted-foreground text-xs">₹{item.price}</p>}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Item actions">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePlanTypeChange(item, "pack")}>
                        <Check className="size-4" />
                        Pack It
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePlanTypeChange(item, "plan")}>
                        <Calendar className="size-4" />
                        Plan It
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteConfirmItem(item)}>
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </div>
          )}
        </>
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

      <Dialog open={deleteConfirmItem !== null} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this item?</DialogTitle>
            <DialogDescription>This can't be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmItem) handleDelete(deleteConfirmItem.id);
                setDeleteConfirmItem(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
