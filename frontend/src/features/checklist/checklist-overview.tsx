import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Check, CheckCheck, ClipboardCheck, Copy, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getCategoryIcon } from "@/lib/checklist-icons";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { CategoryView } from "@/features/checklist/category-view";
import type { ChecklistCategory } from "@/types";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

interface CategoryGroup {
  category: ChecklistCategory;
  items: ChecklistItemDTO[];
}

interface OverallProgress {
  total: number;
  completed: number;
}

export function ChecklistOverview({
  groups,
  overall,
  initialBulkEdit = false,
}: {
  groups: CategoryGroup[];
  overall: OverallProgress;
  initialBulkEdit?: boolean;
}) {
  const overallPercent = overall.total > 0 ? Math.round((overall.completed / overall.total) * 100) : 0;
  const [bulkEditMode, setBulkEditMode] = useState(initialBulkEdit);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const allItemIds = useMemo(() => new Set(groups.flatMap((g) => g.items.map((i) => i.id))), [groups]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function exitBulkEditMode() {
    setBulkEditMode(false);
    setSelectedIds([]);
  }

  async function runGlobalBulkAction(action: "complete" | "incomplete" | "delete" | "duplicate") {
    setBulkActionLoading(true);
    try {
      await api.post("/api/checklist/bulk-action", { ids: selectedIds, action });
      emitRefresh();

      const verb = action === "duplicate" ? "duplicated" : action === "delete" ? "deleted" : `marked ${action}`;
      toast.success(`${selectedIds.length} item(s) ${verb}`);
      exitBulkEditMode();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Bulk action failed");
    } finally {
      setBulkActionLoading(false);
    }
  }

  // Selections can go stale after a refresh (e.g. deleted elsewhere) — drop any ids no longer present.
  const validSelectedIds = selectedIds.filter((id) => allItemIds.has(id));

  return (
    <div>
      {!bulkEditMode && (
        <div className="mb-4 flex justify-end">
          <Link
            to="/checklist"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium"
          >
            <BookOpen className="size-4" />
            Notebook view
          </Link>
        </div>
      )}

      {bulkEditMode && (
        <div className="bg-muted mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium">
            {validSelectedIds.length > 0 ? `${validSelectedIds.length} selected` : "Bulk edit — tap items to select"}
          </span>
          <Button size="sm" variant="ghost" onClick={exitBulkEditMode}>
            Cancel
          </Button>
        </div>
      )}

      <Card className="mb-4 flex-row items-center gap-3 p-3">
        <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-full">
          <ClipboardCheck className="text-primary size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Overall progress</p>
          <p className="text-muted-foreground text-xs">
            {overall.completed} / {overall.total} items packed
          </p>
          <Progress value={overallPercent} className="mt-1.5 h-1.5" />
        </div>
        <span className="text-lg font-bold">{overallPercent}%</span>
      </Card>

      <Accordion
        type="multiple"
        className="border-border/60 bg-card divide-border/60 flex flex-col divide-y overflow-hidden rounded-2xl border shadow-sm"
      >
        {groups.map(({ category, items }) => {
          const Icon = getCategoryIcon(category);
          const completed = items.filter((i) => i.completed).length;
          const remaining = items.length - completed;
          const allDone = items.length > 0 && remaining === 0;

          return (
            <AccordionItem key={category} value={category} className="border-none">
              <AccordionTrigger className="hover:bg-muted/50 px-3 py-2.5 hover:no-underline">
                <div className="flex flex-1 items-center gap-3">
                  <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-full">
                    <Icon className="text-primary size-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate font-medium">{category}</p>
                    <p className="text-muted-foreground truncate text-sm">
                      {items.length === 0 ? "No items yet" : allDone ? "All packed" : `${completed}/${items.length} packed`}
                    </p>
                  </div>
                  {items.length === 0 ? null : allDone ? (
                    <CheckCheck className="text-primary size-5 shrink-0" />
                  ) : (
                    <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                      {remaining}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-2">
                <CategoryView
                  category={category}
                  allCategories={groups.map((g) => g.category)}
                  initialItems={items}
                  embedded
                  hideToolbar
                  selectMode={bulkEditMode}
                  selectedIds={validSelectedIds}
                  onToggleSelected={toggleSelected}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {bulkEditMode && validSelectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-4 bottom-20 z-40 lg:inset-x-auto lg:right-8 lg:bottom-28 lg:left-auto"
        >
          <Card className="flex-row flex-wrap items-center gap-3 p-4 shadow-xl">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={bulkActionLoading} onClick={() => runGlobalBulkAction("complete")}>
                <Check className="size-4" />
                Complete
              </Button>
              <Button size="sm" variant="outline" disabled={bulkActionLoading} onClick={() => runGlobalBulkAction("incomplete")}>
                <X className="size-4" />
                Incomplete
              </Button>
              <Button size="sm" variant="outline" disabled={bulkActionLoading} onClick={() => runGlobalBulkAction("duplicate")}>
                <Copy className="size-4" />
                Duplicate
              </Button>
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="destructive" disabled={bulkActionLoading}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                }
                title={`Delete ${validSelectedIds.length} item(s)?`}
                description="This can't be undone."
                onConfirm={() => runGlobalBulkAction("delete")}
              />
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
