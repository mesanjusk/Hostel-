import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StatCard } from "@/components/shared/stat-card";
import { api, ApiError, peekCache } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Repeat } from "lucide-react";
import type { RetentionResponse } from "@/features/admin-analytics/analytics-dto";

const RETENTION_PATH = "/api/analytics/retention";

function heatColor(rate: number): string {
  if (rate === 0) return "bg-muted";
  if (rate < 15) return "bg-primary/15";
  if (rate < 35) return "bg-primary/35";
  if (rate < 60) return "bg-primary/60";
  return "bg-primary/90";
}

export function RetentionTab() {
  const [data, setData] = useState<RetentionResponse | null>(() => peekCache(RETENTION_PATH) ?? null);

  useEffect(() => {
    api
      .get<RetentionResponse>(RETENTION_PATH)
      .then(setData)
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load retention"));
  }, []);

  if (!data) return null;

  const { retention, returningUsers, totalVisitorsInWindow, cohorts } = data.retention;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {retention.map((r) => (
          <StatCard
            key={r.windowDays}
            icon={<Repeat className="size-5" />}
            label={`${r.windowDays}-day retention`}
            value={`${r.retentionRate}%`}
            hint={`${r.retainedVisitors} of ${r.eligibleVisitors} eligible visitors`}
            tone="primary"
          />
        ))}
        <StatCard icon={<Users className="size-5" />} label="Returning visitors (90d)" value={returningUsers.toLocaleString("en-IN")} hint={`of ${totalVisitorsInWindow} total`} tone="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cohort analysis — weekly retention</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {cohorts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Not enough data yet for a cohort grid.</p>
          ) : (
            <table className="w-full min-w-[640px] border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="text-muted-foreground px-2 py-1 text-left font-medium">Cohort week</th>
                  <th className="text-muted-foreground px-2 py-1 text-left font-medium">Size</th>
                  {cohorts[0].weeks.map((w) => (
                    <th key={w.weekIndex} className="text-muted-foreground px-2 py-1 font-medium">
                      W{w.weekIndex}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort) => (
                  <tr key={cohort.cohortWeek}>
                    <td className="text-foreground px-2 py-1 font-medium whitespace-nowrap">{cohort.cohortWeek}</td>
                    <td className="text-muted-foreground px-2 py-1">{cohort.cohortSize}</td>
                    {cohort.weeks.map((w) => (
                      <td key={w.weekIndex} className={`rounded-md px-2 py-1.5 text-center text-foreground ${heatColor(w.retentionRate)}`}>
                        {cohort.cohortSize === 0 ? "—" : `${w.retentionRate}%`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
