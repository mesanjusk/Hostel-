import { useEffect, useState } from "react";
import { Radio, Users } from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/shared/stat-card";
import { api, ApiError, peekCache } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import type { RealtimeResponse } from "@/features/admin-analytics/analytics-dto";

const POLL_INTERVAL_MS = 8000;
const REALTIME_PATH = "/api/analytics/realtime";

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

export function RealtimeTab() {
  const [data, setData] = useState<RealtimeResponse | null>(() => peekCache(REALTIME_PATH) ?? null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      api
        .get<RealtimeResponse>(REALTIME_PATH)
        .then((res) => {
          if (!cancelled) setData(res);
        })
        .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load real-time data"));
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!data) return null;

  const { realtime } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={<Radio className="size-5" />} label="Online right now" value={realtime.onlineCount.toLocaleString("en-IN")} tone="success" />
        <StatCard icon={<Users className="size-5" />} label="Live visitors listed" value={realtime.liveVisitors.length.toLocaleString("en-IN")} tone="primary" delay={0.05} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live visitors</CardTitle>
        </CardHeader>
        <CardContent>
          {realtime.liveVisitors.length === 0 ? (
            <EmptyState icon={Radio} title="No one online right now" description="Live visitors will appear here as soon as they're active." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Signed in</TableHead>
                  <TableHead className="text-right">Last seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realtime.liveVisitors.map((v) => (
                  <TableRow key={v.visitorId}>
                    <TableCell className="max-w-[220px] truncate">{v.page ?? "—"}</TableCell>
                    <TableCell>{v.country ?? "—"}</TableCell>
                    <TableCell className="capitalize">{v.device ?? "—"}</TableCell>
                    <TableCell>{v.browser ?? "—"}</TableCell>
                    <TableCell>{v.loggedIn ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">{timeAgo(v.lastSeen)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {realtime.recentRegistrations.length === 0 ? (
              <p className="text-muted-foreground text-sm">None in the last 15 minutes.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {realtime.recentRegistrations.map((r, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>
                      {r.country ?? "Unknown"} · {r.device ?? "unknown device"}
                    </span>
                    <span className="text-muted-foreground text-xs">{timeAgo(String(r.timestamp))}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent logins</CardTitle>
          </CardHeader>
          <CardContent>
            {realtime.recentLogins.length === 0 ? (
              <p className="text-muted-foreground text-sm">None in the last 15 minutes.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {realtime.recentLogins.map((r, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>
                      {r.country ?? "Unknown"} · {r.device ?? "unknown device"}
                    </span>
                    <span className="text-muted-foreground text-xs">{timeAgo(String(r.timestamp))}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
