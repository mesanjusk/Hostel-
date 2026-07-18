import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Check, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { HandDrawnCheckbox } from "@/features/checklist/hand-drawn-checkbox";
import { ItemFormDialog } from "@/features/checklist/item-form-dialog";
import { ItemDetailSheet } from "@/features/checklist/item-detail-sheet";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { ChecklistPlanType } from "@/types";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";
import type { PlanTypeFilter } from "@/features/checklist/notebook-view";

/** One category's notebook page, collapsed to a header row until tapped open — same paper
 * look and item styling as before, just no longer paginated one category at a time. */
export function NotebookCategorySection({
  category,
  allCategories,
  items,
  planTypeFilter,
  expanded,
  onToggleExpanded,
  onItemsChange,
  isLast,
}: {
  category: string;
  allCategories: string[];
  items: ChecklistItemDTO[];
  planTypeFilter: PlanTypeFilter;
  expanded: boolean;
  onToggleExpanded: () => void;
  onItemsChange: (updater: (prev: ChecklistItemDTO[]) => ChecklistItemDTO[]) => void;
  isLast: boolean;
}) {
  const [detailItem, setDetailItem] = useState<ChecklistItemDTO | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function toggle(item: ChecklistItemDTO) {
    onItemsChange((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)));
    try {
      await api.patch(`/api/checklist/${item.id}`, { completed: !item.completed });
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update item");
      onItemsChange((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: item.completed } : i)));
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
    setDetailItem((prev) => (prev && prev.id === item.id ? { ...prev, planType } : prev));
    try {
      await api.patch(`/api/checklist/${item.id}`, { planType });
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update item");
    }
  }

  // Each tab shows only its own bucket: unclassified items land on "Unsorted" instead of
  // being folded into Pack it, so the user has to actively choose a side for them.
  const visibleItems =
    planTypeFilter === "unsorted"
      ? items.filter((i) => i.planType == null)
      : items.filter((i) => i.planType === planTypeFilter);
  const pending = visibleItems.filter((i) => !i.completed);
  const completed = visibleItems.filter((i) => i.completed);
  const planTypeLabel = planTypeFilter === "pack" ? "pack it" : planTypeFilter === "plan" ? "plan it" : "sort";

  return (
    <div className={cn("relative border-b border-dashed border-[#e9ddc9]/80 py-4 sm:py-5", isLast && "border-b-0")}>
      <button type="button" onClick={onToggleExpanded} className="flex w-full items-end justify-between gap-3 text-left">
        <div className="min-w-0">
          <h2
            className="text-3xl leading-none font-bold text-[#3a2e2a] sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-caveat-notebook)" }}
          >
            {category}
          </h2>
          <p className="mt-1 text-sm text-[#8a7a6a] lg:text-base">
            {items.length === 0 ? "nothing added yet" : `${items.filter((i) => i.completed).length}/${items.length} packed`}
          </p>
        </div>
        {/* Arrow sits at the bottom-right of the header block (aligned to the item-end of
            the two-line title) rather than vertically centered, so it reads as "expand what's
            below" — mirrors the old page's bottom-right corner-peel decoration. */}
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center self-end rounded-full bg-white text-[#8a7a6a] shadow-sm transition-transform duration-200",
            expanded && "rotate-180",
          )}
          aria-hidden
        >
          <ChevronDown className="size-4" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <LayoutGroup>
              <div className="mt-4 space-y-0.5 lg:space-y-1" style={{ touchAction: "pan-y" }}>
                {items.length === 0 ? (
                  <p className="text-center text-xl text-[#8a7a6a] lg:text-2xl" style={{ fontFamily: "var(--font-caveat-notebook)" }}>
                    add your first item below ✨
                  </p>
                ) : visibleItems.length === 0 ? (
                  <p className="text-center text-xl text-[#8a7a6a] lg:text-2xl" style={{ fontFamily: "var(--font-caveat-notebook)" }}>
                    nothing to {planTypeLabel} here ✨
                  </p>
                ) : pending.length === 0 ? (
                  <p className="text-center text-xl text-[#8a7a6a] lg:text-2xl" style={{ fontFamily: "var(--font-caveat-notebook)" }}>
                    all packed for {category.toLowerCase()}! 🎉
                  </p>
                ) : (
                  <AnimatePresence initial={false}>
                    {pending.map((item) => (
                      <motion.div
                        key={item.id}
                        layoutId={`item-${item.id}`}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ x: 2 }}
                        className="flex items-center gap-3 border-b border-dashed border-[#e9ddc9]/80 py-2 lg:gap-4 lg:py-3"
                      >
                        <HandDrawnCheckbox checked={false} onClick={() => toggle(item)} />
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="block max-w-full truncate pr-1 text-left text-lg text-[#3a2e2a] sm:text-xl lg:text-2xl"
                          style={{ fontFamily: "var(--font-caveat-notebook)" }}
                        >
                          {item.item}
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="mt-2 flex items-center gap-1 text-lg text-[#8a7a6a] underline decoration-dashed underline-offset-4 hover:text-[#3a2e2a] sm:text-xl"
                  style={{ fontFamily: "var(--font-caveat-notebook)" }}
                >
                  <Plus className="size-4" />
                  Add item
                </button>
              </div>

              {completed.length > 0 && (
                <div className="torn-edge relative z-10 -mx-5 mt-3 bg-[#f3e6d5] px-5 pt-4 pb-3 sm:-mx-8 sm:px-8">
                  <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#8a7a6a] uppercase">Completed</p>
                  <div className="flex flex-wrap gap-2">
                    {completed.map((item) => (
                      <motion.button
                        key={item.id}
                        layoutId={`item-${item.id}`}
                        layout
                        type="button"
                        onClick={() => toggle(item)}
                        whileTap={{ scale: 0.94 }}
                        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs text-[#8a7a6a] shadow-sm"
                      >
                        <Check className="size-3 shrink-0 text-[#c0392b]" />
                        <span className="max-w-[120px] truncate pr-0.5 line-through">{item.item}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>

      <ItemFormDialog
        categories={allCategories}
        category={category}
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) emitRefresh();
        }}
      />

      <ItemDetailSheet
        item={detailItem}
        open={detailItem !== null}
        onOpenChange={(open) => !open && setDetailItem(null)}
        onDelete={handleDelete}
        onPlanTypeChange={handlePlanTypeChange}
      />
    </div>
  );
}
