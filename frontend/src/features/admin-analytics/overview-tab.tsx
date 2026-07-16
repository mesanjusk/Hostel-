import { useEffect, useState } from "react";
import { Users, UserPlus, Repeat, Activity, Clock, MousePointerClick, Layers, LogIn } from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/shared/stat-card";
import { api, ApiError, peekCache } from "@/lib/api";
import { CountedTable } from "@/features/admin-analytics/counted-table";
import type { DateRangeValue } from "@/features/admin-analytics/date-range-filter";
import type { OverviewResponse } from "@/features/admin-analytics/analytics-dto";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function OverviewTab({ range }: { range: DateRangeValue }) {
  const path = `/api/analytics/overview?from=${range.from}&to=${range.to}`;
  const [data, setData] = useState<OverviewResponse | null>(() => peekCache(path) ?? null);

  useEffect(() => {
    api
      .get<OverviewResponse>(path)
      .then(setData)
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load overview"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  if (!data) return null;

  const { visitors, activity, sessions } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Users className="size-5" />} label="Total visitors" value={visitors.totalVisitors.toLocaleString("en-IN")} tone="primary" />
        <StatCard icon={<UserPlus className="size-5" />} label="New visitors" value={visitors.newVisitors.toLocaleString("en-IN")} tone="success" delay={0.05} />
        <StatCard icon={<Repeat className="size-5" />} label="Returning visitors" value={visitors.returningVisitors.toLocaleString("en-IN")} tone="accent" delay={0.1} />
        <StatCard icon={<Activity className="size-5" />} label="Online now" value={activity.onlineNow.toLocaleString("en-IN")} tone="warning" delay={0.15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Activity className="size-5" />} label="Active today" value={activity.activeToday.toLocaleString("en-IN")} tone="primary" />
        <StatCard icon={<Activity className="size-5" />} label="Active yesterday" value={activity.activeYesterday.toLocaleString("en-IN")} tone="success" delay={0.05} />
        <StatCard icon={<Activity className="size-5" />} label="Active this week" value={activity.activeThisWeek.toLocaleString("en-IN")} tone="accent" delay={0.1} />
        <StatCard icon={<Activity className="size-5" />} label="Active this month" value={activity.activeThisMonth.toLocaleString("en-IN")} tone="warning" delay={0.15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<LogIn className="size-5" />} label="Sessions" value={sessions.sessionCount.toLocaleString("en-IN")} tone="primary" />
        <StatCard icon={<Clock className="size-5" />} label="Avg session duration" value={formatDuration(sessions.avgSessionDurationSeconds)} tone="success" delay={0.05} />
        <StatCard icon={<MousePointerClick className="size-5" />} label="Bounce rate" value={`${sessions.bounceRate}%`} tone="destructive" delay={0.1} />
        <StatCard icon={<Layers className="size-5" />} label="Pages per session" value={String(sessions.pagesPerSession)} tone="accent" delay={0.15} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CountedTable title="Landing pages" valueLabel="Page" rows={sessions.landingPages} filename="landing-pages" />
        <CountedTable title="Entry pages" valueLabel="Page" rows={sessions.entryPages} filename="entry-pages" />
        <CountedTable title="Exit pages" valueLabel="Page" rows={sessions.exitPages} filename="exit-pages" />
      </div>
    </div>
  );
}
