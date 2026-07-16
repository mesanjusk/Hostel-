import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";

import { HandDrawnCheckbox } from "@/features/checklist/hand-drawn-checkbox";
import { ItemFormDialog } from "@/features/checklist/item-form-dialog";
import { ItemDetailSheet } from "@/features/checklist/item-detail-sheet";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { ChecklistPlanType } from "@/types";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

/** Fades in only during the ancestor page's exit transition — variant state ("enter" /
 * "center" / "exit") propagates down from the flip wrapper in notebook-view.tsx. */
const cornerPeelVariants = {
  enter: { opacity: 0 },
  center: { opacity: 0 },
  exit: { opacity: 1 },
};

export function NotebookPage({
  category,
  allCategories,
  items,
  planTypeFilter,
  onItemsChange,
}: {
  category: string;
  allCategories: string[];
  items: ChecklistItemDTO[];
  planTypeFilter: ChecklistPlanType;
  onItemsChange: (updater: (prev: ChecklistItemDTO[]) => ChecklistItemDTO[]) => void;
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

  // Every item lives under "Pack it" (including anything not yet classified) until the
  // user explicitly moves it to "Plan it" — so the pack tab is everything minus plan items.
  const visibleItems =
    planTypeFilter === "plan" ? items.filter((i) => i.planType === "plan") : items.filter((i) => i.planType !== "plan");
  const pending = visibleItems.filter((i) => !i.completed);
  const completed = visibleItems.filter((i) => i.completed);
  const planTypeLabel = planTypeFilter === "pack" ? "pack it" : "plan it";

  return (
    <div className="exam-paper relative flex h-full min-h-[70vh] flex-col overflow-hidden rounded-[20px] border border-[#e9ddc9] p-5 shadow-[0_2px_14px_rgba(58,46,42,0.14)] sm:min-h-[560px] sm:p-8 lg:min-h-[calc(100dvh-230px)] lg:p-10">
      <motion.div
        variants={cornerPeelVariants}
        className="pointer-events-none absolute right-0 bottom-0 h-20 w-20"
        style={{
          clipPath: "polygon(100% 100%, 28% 100%, 100% 28%)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(201,107,154,0.3) 100%)",
          boxShadow: "-3px -3px 8px rgba(58,46,42,0.12)",
        }}
      />

      <h2
        className="relative z-10 text-4xl leading-none font-bold text-[#3a2e2a] sm:text-5xl lg:text-6xl"
        style={{ fontFamily: "var(--font-caveat-notebook)" }}
      >
        {category}
      </h2>
      <p className="relative z-10 mt-1.5 text-sm text-[#8a7a6a] lg:text-base">
        {items.length === 0
          ? "nothing added yet"
          : visibleItems.length === 0
            ? `nothing to ${planTypeLabel} here`
            : `${completed.length}/${visibleItems.length} packed`}
      </p>

      <LayoutGroup>
        <div
          className="relative z-10 mt-4 flex-1 space-y-0.5 overflow-y-auto lg:mt-8 lg:space-y-1"
          style={{ touchAction: "pan-y" }}
        >
          {items.length === 0 ? (
            <p
              className="mt-10 text-center text-xl text-[#8a7a6a] lg:text-2xl"
              style={{ fontFamily: "var(--font-caveat-notebook)" }}
            >
              add your first item below ✨
            </p>
          ) : visibleItems.length === 0 ? (
            <p
              className="mt-10 text-center text-xl text-[#8a7a6a] lg:text-2xl"
              style={{ fontFamily: "var(--font-caveat-notebook)" }}
            >
              nothing to {planTypeLabel} here ✨
            </p>
          ) : pending.length === 0 ? (
            <p
              className="mt-10 text-center text-xl text-[#8a7a6a] lg:text-2xl"
              style={{ fontFamily: "var(--font-caveat-notebook)" }}
            >
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
