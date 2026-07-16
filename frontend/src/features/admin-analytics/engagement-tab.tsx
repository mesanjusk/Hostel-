import { useEffect, useState } from "react";
import { MousePointerClick, Ban } from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/shared/stat-card";
import { api, ApiError, peekCache } from "@/lib/api";
import { CountedTable } from "@/features/admin-analytics/counted-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DateRangeValue } from "@/features/admin-analytics/date-range-filter";
import type { EngagementResponse } from "@/features/admin-analytics/analytics-dto";

export function EngagementTab({ range }: { range: DateRangeValue }) {
  const path = `/api/analytics/engagement?from=${range.from}&to=${range.to}`;
  const [data, setData] = useState<EngagementResponse | null>(() => peekCache(path) ?? null);

  useEffect(() => {
    api
      .get<EngagementResponse>(path)
      .then(setData)
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load engagement"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={<MousePointerClick className="size-5" />} label="Total dead clicks" value={data.interactions.deadClickCount.toLocaleString("en-IN")} tone="destructive" />
        <StatCard icon={<Ban className="size-5" />} label="Tracked forms" value={data.interactions.formInteractions.length.toLocaleString("en-IN")} tone="accent" delay={0.05} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CountedTable title="Most visited pages" valueLabel="Page" rows={data.pages.mostVisited} filename="most-visited-pages" />
        <CountedTable title="Least visited pages" valueLabel="Page" rows={data.pages.leastVisited} filename="least-visited-pages" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average scroll depth</CardTitle>
          </CardHeader>
          <CardContent>
            {data.pages.avgScroll.length === 0 ? (
              <p className="text-muted-foreground text-sm">No scroll data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Avg scroll %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pages.avgScroll.map((row) => (
                    <TableRow key={row.page}>
                      <TableCell className="max-w-[280px] truncate">{row.page}</TableCell>
                      <TableCell className="text-right">{row.avgScrollPercent}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average time on page</CardTitle>
          </CardHeader>
          <CardContent>
            {data.pages.avgTimeOnPage.length === 0 ? (
              <p className="text-muted-foreground text-sm">No time-on-page data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Avg seconds</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pages.avgTimeOnPage.map((row) => (
                    <TableRow key={row.page}>
                      <TableCell className="max-w-[280px] truncate">{row.page}</TableCell>
                      <TableCell className="text-right">{row.avgSeconds}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CountedTable title="Most clicked buttons" valueLabel="Button" rows={data.interactions.mostClickedButtons} filename="most-clicked-buttons" />
        <CountedTable title="Form interactions" valueLabel="Form" rows={data.interactions.formInteractions} filename="form-interactions" />
      </div>
    </div>
  );
}
