"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Check, Copy, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { HandDrawnCheckbox } from "@/features/checklist/hand-drawn-checkbox";
import { ItemFormDialog } from "@/features/checklist/item-form-dialog";
import { QuickRenameDialog } from "@/features/checklist/quick-rename-dialog";
import {
  bulkChecklistAction,
  deleteChecklistItemAction,
  updateChecklistItemAction,
} from "@/actions/checklist";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

/** Fades in only during the ancestor page's exit transition — variant state ("enter" /
 * "center" / "exit") propagates down from the flip wrapper in notebook-view.tsx. */
const cornerPeelVariants = {
  enter: { opacity: 0 },
  center: { opacity: 0 },
  exit: { opacity: 1 },
};

function ItemRowMenu({
  item,
  category,
  allCategories,
  onRename,
  onDuplicate,
  onDelete,
}: {
  item: ChecklistItemDTO;
  category: string;
  allCategories: string[];
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      data-no-flip
      className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-[#8a7a6a] hover:text-[#3a2e2a]"
            aria-label="Edit item"
          >
            <Pencil className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRename}>
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
          <DropdownMenuItem onClick={onDuplicate}>
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
            className="text-destructive hover:text-destructive size-7"
            aria-label="Delete item"
          >
            <Trash2 className="size-3.5" />
          </Button>
        }
        title="Delete this item?"
        description="This can't be undone."
        onConfirm={onDelete}
      />
    </div>
  );
}

export function NotebookPage({
  category,
  allCategories,
  items,
  onItemsChange,
}: {
  category: string;
  allCategories: string[];
  items: ChecklistItemDTO[];
  onItemsChange: (updater: (prev: ChecklistItemDTO[]) => ChecklistItemDTO[]) => void;
}) {
  const router = useRouter();
  const [renameItem, setRenameItem] = useState<ChecklistItemDTO | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function toggle(item: ChecklistItemDTO) {
    onItemsChange((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)),
    );
    const result = await updateChecklistItemAction({ id: item.id, completed: !item.completed });
    if (!result.success) {
      toast.error(result.error);
      onItemsChange((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, completed: item.completed } : i)),
      );
    }
  }

  async function handleDelete(id: string) {
    onItemsChange((prev) => prev.filter((i) => i.id !== id));
    const result = await deleteChecklistItemAction(id);
    if (!result.success) toast.error(result.error);
  }

  async function handleDuplicate(id: string) {
    const result = await bulkChecklistAction({ ids: [id], action: "duplicate" });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Item duplicated");
    router.refresh();
  }

  const pending = items.filter((i) => !i.completed);
  const completed = items.filter((i) => i.completed);

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
        {items.length === 0 ? "nothing added yet" : `${completed.length}/${items.length} packed`}
      </p>

      <LayoutGroup>
        <div className="relative z-10 mt-4 flex-1 space-y-0.5 overflow-y-auto lg:mt-8 lg:space-y-1">
          {items.length === 0 ? (
            <p
              className="mt-10 text-center text-xl text-[#8a7a6a] lg:text-2xl"
              style={{ fontFamily: "var(--font-caveat-notebook)" }}
            >
              add your first item below ✨
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
                  className="group flex items-center gap-3 border-b border-dashed border-[#e9ddc9]/80 py-2 lg:gap-4 lg:py-3"
                >
                  <HandDrawnCheckbox checked={false} onClick={() => toggle(item)} />
                  <span
                    className="min-w-0 flex-1 truncate text-lg text-[#3a2e2a] sm:text-xl lg:text-2xl"
                    style={{ fontFamily: "var(--font-caveat-notebook)" }}
                  >
                    {item.item}
                  </span>
                  <ItemRowMenu
                    item={item}
                    category={category}
                    allCategories={allCategories}
                    onRename={() => setRenameItem(item)}
                    onDuplicate={() => handleDuplicate(item.id)}
                    onDelete={() => handleDelete(item.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          <button
            type="button"
            data-no-flip
            onClick={() => setAddOpen(true)}
            className="mt-2 flex items-center gap-1 text-sm font-semibold text-[#8a7a6a] underline decoration-dashed underline-offset-4 hover:text-[#3a2e2a] lg:text-base"
          >
            <Plus className="size-4" />
            Add item
          </button>
        </div>

        {completed.length > 0 && (
          <div className="torn-edge relative z-10 -mx-5 mt-3 bg-[#f3e6d5] px-5 pt-4 pb-3 sm:-mx-8 sm:px-8">
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#8a7a6a] uppercase">
              Completed
            </p>
            <div className="flex flex-wrap gap-2">
              {completed.map((item) => (
                <motion.button
                  key={item.id}
                  layoutId={`item-${item.id}`}
                  layout
                  type="button"
                  data-no-flip
                  onClick={() => toggle(item)}
                  whileTap={{ scale: 0.94 }}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs text-[#8a7a6a] shadow-sm"
                >
                  <Check className="size-3 shrink-0 text-[#c0392b]" />
                  <span className="max-w-[120px] truncate line-through">{item.item}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </LayoutGroup>

      {renameItem && (
        <QuickRenameDialog
          id={renameItem.id}
          currentName={renameItem.item}
          open={renameItem !== null}
          onOpenChange={(open) => !open && setRenameItem(null)}
        />
      )}

      <ItemFormDialog
        categories={allCategories}
        category={category}
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) router.refresh();
        }}
      />
    </div>
  );
}
