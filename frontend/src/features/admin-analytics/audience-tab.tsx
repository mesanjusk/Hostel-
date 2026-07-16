import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, peekCache } from "@/lib/api";
import { CountedTable } from "@/features/admin-analytics/counted-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DateRangeValue } from "@/features/admin-analytics/date-range-filter";
import type { TechResponse, GeoResponse, ReferralResponse } from "@/features/admin-analytics/analytics-dto";

export function AudienceTab({ range }: { range: DateRangeValue }) {
  const qs = `?from=${range.from}&to=${range.to}`;
  const techPath = `/api/analytics/tech${qs}`;
  const geoPath = `/api/analytics/geo${qs}`;
  const referralPath = `/api/analytics/referral${qs}`;
  const [tech, setTech] = useState<TechResponse | null>(() => peekCache(techPath) ?? null);
  const [geo, setGeo] = useState<GeoResponse | null>(() => peekCache(geoPath) ?? null);
  const [referral, setReferral] = useState<ReferralResponse | null>(() => peekCache(referralPath) ?? null);

  useEffect(() => {
    api.get<TechResponse>(techPath).then(setTech).catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to load"));
    api.get<GeoResponse>(geoPath).then(setGeo).catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to load"));
    api
      .get<ReferralResponse>(referralPath)
      .then(setReferral)
      .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  return (
    <div className="flex flex-col gap-6">
      {tech && (
        <div className="grid gap-4 lg:grid-cols-3">
          <CountedTable title="Device type" valueLabel="Device" rows={tech.tech.devices} filename="devices" />
          <CountedTable title="Browser" valueLabel="Browser" rows={tech.tech.browsers} filename="browsers" />
          <CountedTable title="Operating system" valueLabel="OS" rows={tech.tech.os} filename="os" />
          <CountedTable title="Screen resolution" valueLabel="Resolution" rows={tech.tech.screenResolutions} filename="screen-resolutions" />
          <CountedTable title="Language" valueLabel="Language" rows={tech.tech.languages} filename="languages" />
          <CountedTable title="Timezone" valueLabel="Timezone" rows={tech.tech.timezones} filename="timezones" />
        </div>
      )}

      {geo && (
        <div className="grid gap-4 lg:grid-cols-3">
          <CountedTable title="Country" valueLabel="Country" rows={geo.geo.countries} filename="countries" />
          <CountedTable title="State" valueLabel="State" rows={geo.geo.states} filename="states" />
          <CountedTable title="City" valueLabel="City" rows={geo.geo.cities} filename="cities" />
        </div>
      )}

      {referral && (
        <div className="grid gap-4 lg:grid-cols-2">
          <CountedTable title="Referral source" valueLabel="Source" rows={referral.referral.referralSources} filename="referral-sources" />
          <Card>
            <CardHeader>
              <CardTitle>UTM campaign performance</CardTitle>
            </CardHeader>
            <CardContent>
              {referral.referral.campaignPerformance.length === 0 ? (
                <p className="text-muted-foreground text-sm">No tagged campaign traffic in this range.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Medium</TableHead>
                      <TableHead className="text-right">Visitors</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referral.referral.campaignPerformance.map((c) => (
                      <TableRow key={`${c.campaign}-${c.source}-${c.medium}`}>
                        <TableCell>{c.campaign}</TableCell>
                        <TableCell>{c.source ?? "—"}</TableCell>
                        <TableCell>{c.medium ?? "—"}</TableCell>
                        <TableCell className="text-right">{c.visitors}</TableCell>
                        <TableCell className="text-right">{c.conversions}</TableCell>
                        <TableCell className="text-right">{c.conversionRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
