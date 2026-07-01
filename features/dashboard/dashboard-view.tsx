"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Wallet,
  ListTodo,
  Heart,
  Sparkles,
  ClipboardList,
  StickyNote,
  Wallet as WalletIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ExpenseMiniChart } from "@/features/dashboard/expense-mini-chart";
import { CHECKLIST_CATEGORY_ICONS } from "@/lib/checklist-icons";
import type { ChecklistPriority } from "@/types";
import type { DashboardDataDTO } from "@/features/dashboard/dashboard-dto";

const PRIORITY_VARIANT: Record<ChecklistPriority, "outline" | "warning" | "destructive"> = {
  low: "outline",
  medium: "warning",
  high: "destructive",
};

const ACTIVITY_ICON = {
  checklist: ClipboardList,
  budget: WalletIcon,
  note: StickyNote,
};

export function DashboardView({
  data,
  name,
}: {
  data: DashboardDataDTO;
  name: string | null;
}) {
  const { overallProgress, categorySummaries, budgetSummary, wishlistCount, upcomingTasks, activity } =
    data;

  const completionPercent =
    overallProgress.total === 0 ? 0 : (overallProgress.completed / overallProgress.total) * 100;
  const itemsRemaining = overallProgress.total - overallProgress.completed;
  const budgetUsedPercent =
    budgetSummary.planned === 0 ? 0 : (budgetSummary.spent / budgetSummary.planned) * 100;

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">
          {name ? `Hey ${name.split(" ")[0]} 👋` : "Welcome 👋"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s how your hostel move-in is going.
        </p>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="items-center justify-center gap-2 p-6 lg:col-span-1">
          <ProgressRing value={completionPercent} label="Packed" />
          <p className="text-muted-foreground mt-2 text-center text-sm">
            {overallProgress.completed} of {overallProgress.total} items packed
          </p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
          <StatCard
            icon={Wallet}
            label="Budget used"
            value={`${Math.round(budgetUsedPercent)}%`}
            hint={`₹${budgetSummary.spent.toLocaleString("en-IN")} of ₹${budgetSummary.planned.toLocaleString("en-IN")}`}
            tone={budgetSummary.remaining < 0 ? "destructive" : "success"}
            delay={0.05}
          />
          <StatCard
            icon={ListTodo}
            label="Items remaining"
            value={String(itemsRemaining)}
            hint="Still to pack or buy"
            tone="primary"
            delay={0.1}
          />
          <StatCard
            icon={Heart}
            label="Wishlist"
            value={String(wishlistCount)}
            hint="Items you're eyeing"
            tone="accent"
            delay={0.15}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExpenseMiniChart byCategory={budgetSummary.byCategory} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {upcomingTasks.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="All caught up!"
                description="No pending high-priority items."
              />
            ) : (
              upcomingTasks.map((task) => {
                const Icon = CHECKLIST_CATEGORY_ICONS[task.category];
                return (
                  <Link
                    key={task.id}
                    href={`/checklist/${encodeURIComponent(task.category)}`}
                    className="hover:bg-muted flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Icon className="text-muted-foreground size-4 shrink-0" />
                      {task.item}
                    </span>
                    <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Packing progress by category</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {categorySummaries
              .filter((c) => c.total > 0)
              .map((c) => {
                const Icon = CHECKLIST_CATEGORY_ICONS[c.category];
                const pct = c.total === 0 ? 0 : Math.round((c.completed / c.total) * 100);
                return (
                  <Link
                    key={c.category}
                    href={`/checklist/${encodeURIComponent(c.category)}`}
                    className="hover:bg-muted flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
                  >
                    <Icon className="text-primary size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.category}</p>
                      <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
                        <div
                          className="gradient-brand h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {c.completed}/{c.total}
                    </span>
                  </Link>
                );
              })}
            {categorySummaries.every((c) => c.total === 0) && (
              <p className="text-muted-foreground col-span-2 text-sm">
                Start adding items to your checklist to see progress here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {activity.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Nothing yet"
                description="Your recent actions will show up here."
              />
            ) : (
              activity.map((entry) => {
                const Icon = ACTIVITY_ICON[entry.type];
                return (
                  <div key={entry.id} className="flex items-center gap-3 px-2 py-2 text-sm">
                    <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
