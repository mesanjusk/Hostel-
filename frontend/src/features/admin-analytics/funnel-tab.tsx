import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StatCard } from "@/components/shared/stat-card";
import { api, ApiError, peekCache } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButtons } from "@/features/admin-analytics/export-buttons";
import type { DateRangeValue } from "@/features/admin-analytics/date-range-filter";
import type { RegistrationFunnelResponse } from "@/features/admin-analytics/analytics-dto";
import { UserX, PhoneOff, ShieldAlert, Clock3, UserMinus, UserCheck } from "lucide-react";

export function FunnelTab({ range }: { range: DateRangeValue }) {
  const path = `/api/analytics/registration-funnel?from=${range.from}&to=${range.to}`;
  const [data, setData] = useState<RegistrationFunnelResponse | null>(() => peekCache(path) ?? null);

  useEffect(() => {
    api
      .get<RegistrationFunnelResponse>(path)
      .then(setData)
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load funnel"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  if (!data) return null;

  const { steps, detected } = data.funnel;
  const maxUsers = Math.max(1, ...steps.map((s) => s.users));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Registration funnel</CardTitle>
          <ExportButtons
            filename="registration-funnel"
            title="Registration funnel"
            columns={[
              { key: "label", label: "Step" },
              { key: "users", label: "Users" },
              { key: "conversionFromStart", label: "Conversion from start (%)" },
              { key: "dropOffFromPrevious", label: "Drop-off from previous (%)" },
              { key: "avgTimeFromPreviousSeconds", label: "Avg time from previous (s)" },
            ]}
            rows={steps}
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {steps.map((step) => {
            const widthPct = Math.max(4, Math.round((step.users / maxUsers) * 100));
            return (
              <div key={step.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{step.label}</span>
                  <span className="text-muted-foreground">
                    {step.users.toLocaleString("en-IN")} users · {step.conversionFromStart}% of start
                    {step.dropOffFromPrevious > 0 && ` · ${step.dropOffFromPrevious}% drop-off`}
                  </span>
                </div>
                <div className="bg-muted h-6 w-full overflow-hidden rounded-full">
                  <div className="gradient-brand flex h-full items-center rounded-full px-3 text-xs text-white" style={{ width: `${widthPct}%` }} />
                </div>
                {step.avgTimeFromPreviousSeconds !== null && (
                  <p className="text-muted-foreground text-xs">Avg time from previous step: {step.avgTimeFromPreviousSeconds}s</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={<UserX className="size-5" />} label="Opened register but left" value={String(detected.openedRegistrationButLeft)} tone="destructive" />
        <StatCard icon={<PhoneOff className="size-5" />} label="Entered mobile but closed" value={String(detected.enteredMobileButClosed)} tone="warning" delay={0.05} />
        <StatCard icon={<ShieldAlert className="size-5" />} label="OTP failed" value={String(detected.otpFailed)} tone="destructive" delay={0.1} />
        <StatCard icon={<Clock3 className="size-5" />} label="OTP timed out" value={String(detected.otpTimeout)} tone="warning" delay={0.15} />
        <StatCard icon={<UserMinus className="size-5" />} label="Registration abandoned" value={String(detected.registrationAbandoned)} tone="destructive" delay={0.2} />
        <StatCard icon={<UserCheck className="size-5" />} label="Registered successfully" value={String(detected.registrationSuccess)} tone="success" delay={0.25} />
      </div>
    </div>
  );
}
