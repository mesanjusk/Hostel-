import { useEffect, useState } from "react";
import { Users, UserCheck, ListChecks, TrendingUp, ShoppingBag, BookOpen, GraduationCap, BookMarked, Lightbulb } from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/checklist-icons";
import { api, ApiError, peekCache } from "@/lib/api";
import type { ChecklistCategory } from "@/types";

const ANALYTICS_PATH = "/api/admin/analytics";
const CHECKLIST_DASHBOARD_PATH = "/api/admin/checklist-dashboard";
const SUGGESTED_ITEMS_PATH = "/api/admin/suggested-items";

interface AdminAnalytics {
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  totalItems: number;
  completedItems: number;
  completionRate: number;
  categoryBreakdown: { category: ChecklistCategory; total: number; completed: number }[];
  totalProducts: number;
  totalGuideArticles: number;
}

interface ChecklistDashboardStats {
  totalCategories: number;
  totalCourses: number;
  totalDefaultItems: number;
  activeDefaultItems: number;
  completionRate: number;
  recentlyAdded: { _id: string; title: string; category: string }[];
  recentlyUpdated: { _id: string; title: string; category: string }[];
}

export function SummaryTab() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(
    () => peekCache<{ analytics: AdminAnalytics }>(ANALYTICS_PATH)?.analytics ?? null,
  );
  const [checklistStats, setChecklistStats] = useState<ChecklistDashboardStats | null>(
    () => peekCache<{ stats: ChecklistDashboardStats }>(CHECKLIST_DASHBOARD_PATH)?.stats ?? null,
  );
  const [suggestedCount, setSuggestedCount] = useState<number | null>(
    () => peekCache<{ suggestions: unknown[] }>(SUGGESTED_ITEMS_PATH)?.suggestions.length ?? null,
  );

  useEffect(() => {
    api
      .get<{ analytics: AdminAnalytics }>(ANALYTICS_PATH)
      .then(({ analytics }) => setAnalytics(analytics))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load analytics"));

    api
      .get<{ stats: ChecklistDashboardStats }>(CHECKLIST_DASHBOARD_PATH)
      .then(({ stats }) => setChecklistStats(stats))
      .catch(() => {});

    api
      .get<{ suggestions: unknown[] }>(SUGGESTED_ITEMS_PATH)
      .then(({ suggestions }) => setSuggestedCount(suggestions.length))
      .catch(() => {});
  }, []);

  if (!analytics) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={<Users className="size-5" />} label="Total students" value={String(analytics.totalUsers)} tone="primary" />
        <StatCard
          icon={<UserCheck className="size-5" />}
          label="Active in last 7 days"
          value={String(analytics.activeUsers7d)}
          hint={`${analytics.activeUsers30d} active in last 30 days`}
          tone="success"
          delay={0.05}
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="Overall completion rate"
          value={`${Math.round(analytics.completionRate)}%`}
          hint={`${analytics.completedItems} of ${analytics.totalItems} items packed`}
          tone="accent"
          delay={0.1}
        />
        <StatCard icon={<ListChecks className="size-5" />} label="Checklist items tracked" value={String(analytics.totalItems)} tone="warning" delay={0.15} />
        <StatCard icon={<ShoppingBag className="size-5" />} label="Products curated" value={String(analytics.totalProducts)} tone="primary" delay={0.2} />
        <StatCard icon={<BookOpen className="size-5" />} label="Guide articles" value={String(analytics.totalGuideArticles)} tone="success" delay={0.25} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist completion by category</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {analytics.categoryBreakdown.map((row) => {
            const Icon = getCategoryIcon(row.category);
            const pct = row.total === 0 ? 0 : Math.round((row.completed / row.total) * 100);
            return (
              <div key={row.category} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <Icon className="text-primary size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.category}</p>
                  <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
                    <div className="gradient-brand h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-muted-foreground text-xs">
                  {row.completed}/{row.total}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {checklistStats && (
        <Card>
          <CardHeader>
            <CardTitle>Checklist catalog</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                icon={<GraduationCap className="size-5" />}
                label="College categories"
                value={String(checklistStats.totalCategories)}
                tone="primary"
              />
              <StatCard icon={<BookMarked className="size-5" />} label="Courses" value={String(checklistStats.totalCourses)} tone="success" />
              <StatCard
                icon={<ListChecks className="size-5" />}
                label="Default checklist items"
                value={String(checklistStats.totalDefaultItems)}
                hint={`${checklistStats.activeDefaultItems} active`}
                tone="warning"
              />
              <StatCard
                icon={<TrendingUp className="size-5" />}
                label="DB-driven completion rate"
                value={`${checklistStats.completionRate}%`}
                tone="accent"
              />
              <StatCard
                icon={<Lightbulb className="size-5" />}
                label="Suggested items pending"
                value={suggestedCount === null ? "…" : String(suggestedCount)}
                tone="primary"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">Recently added</p>
                <ul className="flex flex-col gap-1">
                  {checklistStats.recentlyAdded.map((item) => (
                    <li key={item._id} className="text-sm">
                      {item.title} <span className="text-muted-foreground">· {item.category}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">Recently updated</p>
                <ul className="flex flex-col gap-1">
                  {checklistStats.recentlyUpdated.map((item) => (
                    <li key={item._id} className="text-sm">
                      {item.title} <span className="text-muted-foreground">· {item.category}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
