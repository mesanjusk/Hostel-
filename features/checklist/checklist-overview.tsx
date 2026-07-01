"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ClipboardCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { CHECKLIST_CATEGORY_ICONS } from "@/lib/checklist-icons";

interface CategorySummary {
  category: string;
  total: number;
  completed: number;
}

interface OverallProgress {
  total: number;
  completed: number;
}

export function ChecklistOverview({
  summaries,
  overall,
}: {
  summaries: CategorySummary[];
  overall: OverallProgress;
}) {
  const overallPercent =
    overall.total > 0 ? Math.round((overall.completed / overall.total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Packing Checklist"
        description="Track everything you need to pack, category by category"
      />

      <Card className="mb-6 p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="gradient-brand flex size-11 items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
              <ClipboardCheck className="size-5 text-white" />
            </div>
            <div>
              <p className="font-display font-semibold">Overall progress</p>
              <p className="text-muted-foreground text-sm">
                {overall.completed} / {overall.total} items packed
              </p>
            </div>
          </div>
          <span className="font-display text-2xl font-bold">{overallPercent}%</span>
        </div>
        <Progress value={overallPercent} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {summaries.map((summary, i) => {
          const Icon = CHECKLIST_CATEGORY_ICONS[summary.category as keyof typeof CHECKLIST_CATEGORY_ICONS];
          const percent =
            summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

          return (
            <motion.div
              key={summary.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/checklist/${encodeURIComponent(summary.category)}`}>
                <Card className="h-full gap-3 p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
                      <Icon className="text-primary size-5" />
                    </div>
                    <h3 className="font-display line-clamp-1 font-semibold">
                      {summary.category}
                    </h3>
                  </div>
                  <Progress value={percent} />
                  <p className="text-muted-foreground text-sm">
                    {summary.completed} / {summary.total} items
                  </p>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
