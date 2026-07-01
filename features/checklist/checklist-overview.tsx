"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  ClipboardCheck,
  Copy,
  ListChecks,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CHECKLIST_CATEGORY_ICONS } from "@/lib/checklist-icons";
import {
  bulkChecklistAction,
  loadStarterChecklistAction,
  mergeDuplicateChecklistItemsAction,
} from "@/actions/checklist";
import { BulkAddDialog } from "@/features/checklist/bulk-add-dialog";
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
}: {
  groups: CategoryGroup[];
  overall: OverallProgress;
}) {
  const router = useRouter();
  const overallPercent =
    overall.total > 0 ? Math.round((overall.completed / overall.total) * 100) : 0;
  const [isLoadingStarter, setIsLoadingStarter] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const allItemIds = useMemo(
    () => new Set(groups.flatMap((g) => g.items.map((i) => i.id))),
    [groups],
  );

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function exitBulkEditMode() {
    setBulkEditMode(false);
    setSelectedIds([]);
  }

  async function handleLoadStarterChecklist() {
    setIsLoadingStarter(true);
    const result = await loadStarterChecklistAction();
    setIsLoadingStarter(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(
      result.count > 0
        ? `Added ${result.count} new item${result.count === 1 ? "" : "s"} from the starter checklist`
        : "You already have every starter checklist item",
    );
    router.refresh();
  }

  async function handleMergeDuplicates() {
    setIsMerging(true);
    const result = await mergeDuplicateChecklistItemsAction();
    setIsMerging(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(
      result.mergedCount > 0
        ? `Merged ${result.mergedCount} duplicate item${result.mergedCount === 1 ? "" : "s"}`
        : "No duplicate items found",
    );
    router.refresh();
  }

  async function runGlobalBulkAction(action: "complete" | "incomplete" | "delete" | "duplicate") {
    setBulkActionLoading(true);
    const result = await bulkChecklistAction({ ids: selectedIds, action });
    setBulkActionLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const verb =
      action === "duplicate" ? "duplicated" : action === "delete" ? "deleted" : `marked ${action}`;
    toast.success(`${selectedIds.length} item(s) ${verb}`);
    exitBulkEditMode();
    router.refresh();
  }

  // Selections can go stale after a refresh (e.g. deleted elsewhere) — drop any ids no longer present.
  const validSelectedIds = selectedIds.filter((id) => allItemIds.has(id));

  return (
    <div>
      <PageHeader
        title="Packing Checklist"
        description="Tap a category to expand it and start ticking things off"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMergeDuplicates}
              disabled={isMerging}
            >
              {isMerging ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              Clean up duplicates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadStarterChecklist}
              disabled={isLoadingStarter}
            >
              {isLoadingStarter ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Load Starter Checklist
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <BulkAddDialog />
        <Button
          variant={bulkEditMode ? "secondary" : "outline"}
          size="sm"
          onClick={() => (bulkEditMode ? exitBulkEditMode() : setBulkEditMode(true))}
        >
          <ListChecks className="size-4" />
          {bulkEditMode ? "Cancel bulk edit" : "Bulk edit"}
        </Button>
      </div>

      <Card className="relative mb-6 overflow-hidden p-6">
        <div className="gradient-brand pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-15 blur-2xl" />
        <div className="relative mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="gradient-brand flex size-12 items-center justify-center rounded-2xl shadow-lg shadow-primary/25">
              <ClipboardCheck className="size-6 text-white" />
            </div>
            <div>
              <p className="font-display font-semibold">Overall progress</p>
              <p className="text-muted-foreground text-sm">
                {overall.completed} / {overall.total} items packed
              </p>
            </div>
          </div>
          <span className="font-display text-3xl font-bold">{overallPercent}%</span>
        </div>
        <Progress value={overallPercent} className="relative" />
      </Card>

      <Accordion type="multiple" className="flex flex-col gap-3">
        {groups.map(({ category, items }) => {
          const Icon = CHECKLIST_CATEGORY_ICONS[category];
          const completed = items.filter((i) => i.completed).length;
          const percent = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

          return (
            <div
              key={category}
              className="border-border/60 bg-card overflow-hidden rounded-2xl border px-2 shadow-sm"
            >
              <AccordionItem value={category} className="border-none">
                <AccordionTrigger className="px-3 py-3 hover:no-underline">
                  <div className="flex flex-1 items-center gap-3">
                    <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-xl">
                      <Icon className="text-primary size-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-display truncate font-semibold">{category}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={percent} className="h-1.5 max-w-[140px]" />
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {completed}/{items.length}
                        </span>
                      </div>
                    </div>
                    {items.length === 0 && (
                      <Badge variant="outline" className="shrink-0">
                        empty
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-1 pb-2">
                  <CategoryView
                    category={category}
                    initialItems={items}
                    embedded
                    hideToolbar
                    selectMode={bulkEditMode}
                    selectedIds={validSelectedIds}
                    onToggleSelected={toggleSelected}
                  />
                </AccordionContent>
              </AccordionItem>
            </div>
          );
        })}
      </Accordion>

      {bulkEditMode && validSelectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-4 bottom-20 z-40 lg:inset-x-auto lg:right-8 lg:bottom-8 lg:left-auto"
        >
          <Card className="flex-row flex-wrap items-center gap-3 p-4 shadow-xl">
            <span className="text-sm font-medium">{validSelectedIds.length} selected</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={bulkActionLoading}
                onClick={() => runGlobalBulkAction("complete")}
              >
                <Check className="size-4" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkActionLoading}
                onClick={() => runGlobalBulkAction("incomplete")}
              >
                <X className="size-4" />
                Incomplete
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkActionLoading}
                onClick={() => runGlobalBulkAction("duplicate")}
              >
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
