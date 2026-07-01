import type { Metadata } from "next";
import { Users, UserCheck, ListChecks, TrendingUp, ShoppingBag, BookOpen } from "lucide-react";

import { getAdminAnalytics } from "@/services/analyticsService";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHECKLIST_CATEGORY_ICONS } from "@/lib/checklist-icons";

export const metadata: Metadata = { title: "Admin Analytics — Hostel Essentials" };

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Total students" value={String(analytics.totalUsers)} tone="primary" />
        <StatCard
          icon={UserCheck}
          label="Active in last 7 days"
          value={String(analytics.activeUsers7d)}
          hint={`${analytics.activeUsers30d} active in last 30 days`}
          tone="success"
          delay={0.05}
        />
        <StatCard
          icon={TrendingUp}
          label="Overall completion rate"
          value={`${Math.round(analytics.completionRate)}%`}
          hint={`${analytics.completedItems} of ${analytics.totalItems} items packed`}
          tone="accent"
          delay={0.1}
        />
        <StatCard
          icon={ListChecks}
          label="Checklist items tracked"
          value={String(analytics.totalItems)}
          tone="warning"
          delay={0.15}
        />
        <StatCard
          icon={ShoppingBag}
          label="Products curated"
          value={String(analytics.totalProducts)}
          tone="primary"
          delay={0.2}
        />
        <StatCard
          icon={BookOpen}
          label="Guide articles"
          value={String(analytics.totalGuideArticles)}
          tone="success"
          delay={0.25}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist completion by category</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {analytics.categoryBreakdown.map((row) => {
            const Icon = CHECKLIST_CATEGORY_ICONS[row.category];
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
  );
}
