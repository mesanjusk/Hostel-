import { useEffect, useState } from "react";
import { Users, UserCheck, ListChecks, TrendingUp, ShoppingBag, BookOpen } from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/checklist-icons";
import { api, ApiError } from "@/lib/api";
import { AdminTabs } from "@/features/admin/admin-tabs";
import type { ChecklistCategory } from "@/types";

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

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);

  useEffect(() => {
    api
      .get<{ analytics: AdminAnalytics }>("/api/admin/analytics")
      .then(({ analytics }) => setAnalytics(analytics))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load analytics"));
  }, []);

  return (
    <div>
      <AdminTabs />
      {!analytics ? null : (
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
        </div>
      )}
    </div>
  );
}
