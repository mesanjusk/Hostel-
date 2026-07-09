import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ListTodo, Heart, Sparkles, ClipboardList, StickyNote, Wallet as WalletIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SuitcaseFill, PiggyBankFill } from "@/components/shared/liquid-fill-icons";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SuccessLottie } from "@/components/shared/success-lottie";
import { SiteFooter } from "@/components/shared/site-footer";
import { ExpenseMiniChart } from "@/features/dashboard/expense-mini-chart";
import { getCategoryIcon } from "@/lib/checklist-icons";
import { mergeDashboardLayout, STAT_CARD_IDS, type WidgetConfig } from "@/features/dashboard/widget-registry";
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

function StatsWidget({ data, visibleStatIds }: { data: DashboardDataDTO; visibleStatIds: Set<string> }) {
  const { overallProgress, budgetSummary, wishlistCount } = data;
  const completionPercent = overallProgress.total === 0 ? 0 : (overallProgress.completed / overallProgress.total) * 100;
  const itemsRemaining = overallProgress.total - overallProgress.completed;
  const budgetUsedPercent = budgetSummary.planned === 0 ? 0 : (budgetSummary.spent / budgetSummary.planned) * 100;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {visibleStatIds.has("stat-packing") && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="from-primary/10 items-center justify-center gap-1 bg-gradient-to-br via-card to-card p-6">
            <div className="relative">
              <SuitcaseFill value={completionPercent} />
              {completionPercent >= 100 && (
                <div className="pointer-events-none absolute -top-3 -right-3">
                  <SuccessLottie size={48} />
                </div>
              )}
            </div>
            <p className="font-display mt-1 text-2xl font-bold">{Math.round(completionPercent)}%</p>
            <p className="text-muted-foreground text-center text-sm">
              {overallProgress.total === 0
                ? "Add items to your checklist to get started"
                : `${overallProgress.completed} of ${overallProgress.total} packed`}
              {completionPercent >= 100 && overallProgress.total > 0 && " — all packed! 🎉"}
            </p>
          </Card>
        </motion.div>
      )}

      {visibleStatIds.has("stat-budget") && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="from-secondary/10 items-center justify-center gap-1 bg-gradient-to-br via-card to-card p-6">
            <PiggyBankFill value={budgetUsedPercent} />
            <p className="font-display mt-1 text-2xl font-bold">{Math.round(budgetUsedPercent)}%</p>
            <p className="text-muted-foreground text-center text-sm">
              ₹{budgetSummary.spent.toLocaleString("en-IN")} of ₹{budgetSummary.planned.toLocaleString("en-IN")} spent
            </p>
          </Card>
        </motion.div>
      )}

      {visibleStatIds.has("stat-items-remaining") && (
        <StatCard
          icon={<ListTodo className="size-5" />}
          label="Items remaining"
          value={String(itemsRemaining)}
          hint="Still to pack or buy"
          tone="primary"
          delay={0.1}
        />
      )}
      {visibleStatIds.has("stat-wishlist") && (
        <StatCard
          icon={<Heart className="size-5" />}
          label="Wishlist"
          value={String(wishlistCount)}
          hint="Items you're eyeing"
          tone="accent"
          delay={0.15}
        />
      )}
    </div>
  );
}

function ExpenseChartWidget({ data }: { data: DashboardDataDTO }) {
  return <ExpenseMiniChart byCategory={data.budgetSummary.byCategory} />;
}

function UpcomingTasksWidget({ data }: { data: DashboardDataDTO }) {
  const { upcomingTasks } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {upcomingTasks.length === 0 ? (
          <EmptyState icon={Sparkles} title="All caught up!" description="No pending high-priority items." />
        ) : (
          upcomingTasks.map((task) => {
            const Icon = getCategoryIcon(task.category);
            return (
              <Link
                key={task.id}
                to={`/checklist/${encodeURIComponent(task.category)}`}
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
  );
}

function CategoryProgressWidget({ data }: { data: DashboardDataDTO }) {
  const { categorySummaries } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Packing progress by category</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-2 gap-y-1 sm:gap-x-3">
        {categorySummaries
          .filter((c) => c.total > 0)
          .map((c) => {
            const Icon = getCategoryIcon(c.category);
            const pct = c.total === 0 ? 0 : Math.round((c.completed / c.total) * 100);
            return (
              <Link
                key={c.category}
                to={`/checklist/${encodeURIComponent(c.category)}`}
                className="hover:bg-muted flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors sm:gap-3 sm:px-2 sm:py-2"
              >
                <Icon className="text-primary size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium sm:text-sm">{c.category}</p>
                  <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
                    <div className="gradient-brand h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-muted-foreground shrink-0 text-[10px] sm:text-xs">
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
  );
}

function RecentActivityWidget({ data }: { data: DashboardDataDTO }) {
  const { activity } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {activity.length === 0 ? (
          <EmptyState icon={Sparkles} title="Nothing yet" description="Your recent actions will show up here." />
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
  );
}

const WIDGET_COMPONENTS: Record<string, (props: { data: DashboardDataDTO }) => React.JSX.Element> = {
  "expense-chart": ExpenseChartWidget,
  "upcoming-tasks": UpcomingTasksWidget,
  "category-progress": CategoryProgressWidget,
  "recent-activity": RecentActivityWidget,
};

export function DashboardView({
  data,
  name,
  layout,
}: {
  data: DashboardDataDTO;
  name: string | null;
  layout?: WidgetConfig[];
}) {
  const order = mergeDashboardLayout(layout);
  const visibleIds = new Set(order.filter((w) => w.visible).map((w) => w.id));
  const anyStatVisible = STAT_CARD_IDS.some((id) => visibleIds.has(id));

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">{name ? `Hey ${name.split(" ")[0]} 👋` : "Welcome 👋"}</h1>
        <p className="text-muted-foreground mt-1 text-sm">Here&apos;s how your hostel move-in is going.</p>
      </motion.div>

      {anyStatVisible && <StatsWidget data={data} visibleStatIds={visibleIds} />}

      {order
        .filter((w) => w.visible && WIDGET_COMPONENTS[w.id])
        .map((w) => {
          const Widget = WIDGET_COMPONENTS[w.id];
          return <Widget key={w.id} data={data} />;
        })}

      <SiteFooter />
    </div>
  );
}
