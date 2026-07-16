import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, peekCache } from "@/lib/api";
import { CountedTable } from "@/features/admin-analytics/counted-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButtons } from "@/features/admin-analytics/export-buttons";
import type { DateRangeValue } from "@/features/admin-analytics/date-range-filter";
import type { BehaviorResponse } from "@/features/admin-analytics/analytics-dto";

export function BehaviorTab({ range }: { range: DateRangeValue }) {
  const path = `/api/analytics/behavior?from=${range.from}&to=${range.to}`;
  const [data, setData] = useState<BehaviorResponse | null>(() => peekCache(path) ?? null);

  useEffect(() => {
    api
      .get<BehaviorResponse>(path)
      .then(setData)
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load behavior analytics"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Page load times</CardTitle>
          <ExportButtons
            filename="page-load-times"
            title="Page load times"
            columns={[
              { key: "page", label: "Page" },
              { key: "avgLoadMs", label: "Avg load (ms)" },
              { key: "samples", label: "Samples" },
            ]}
            rows={data.pageLoad.pages}
          />
        </CardHeader>
        <CardContent>
          {data.pageLoad.pages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No load-time samples yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Avg load</TableHead>
                  <TableHead className="text-right">Samples</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pageLoad.pages.map((row) => {
                  const slow = row.avgLoadMs >= 1500;
                  return (
                    <TableRow key={row.page}>
                      <TableCell className="max-w-[280px] truncate">{row.page}</TableCell>
                      <TableCell className="text-right">{row.avgLoadMs}ms</TableCell>
                      <TableCell className="text-right">{row.samples}</TableCell>
                      <TableCell className={`text-right text-xs font-medium ${slow ? "text-destructive" : "text-success"}`}>
                        {slow ? "Slow" : "OK"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <CountedTable title="Most common page transitions" valueLabel="Transition" rows={data.navigation.transitions} filename="page-transitions" />
        <CountedTable title="Most common journeys (first 4 pages)" valueLabel="Path" rows={data.navigation.commonPaths} filename="common-paths" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CountedTable title="First page seen" valueLabel="Page" rows={data.navigation.firstPages} filename="first-pages" />
        <CountedTable title="Last page seen" valueLabel="Page" rows={data.navigation.lastPages} filename="last-pages" />
      </div>
    </div>
  );
}
