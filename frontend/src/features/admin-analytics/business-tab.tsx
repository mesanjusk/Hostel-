import { useEffect, useState } from "react";
import { Users, UserPlus, UserCheck, UserX, ArrowRightLeft, Repeat } from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/shared/stat-card";
import { api, ApiError, peekCache } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DateRangeValue } from "@/features/admin-analytics/date-range-filter";
import type { BusinessResponse } from "@/features/admin-analytics/analytics-dto";

export function BusinessTab({ range }: { range: DateRangeValue }) {
  const path = `/api/analytics/business?from=${range.from}&to=${range.to}`;
  const [data, setData] = useState<BusinessResponse | null>(() => peekCache(path) ?? null);

  useEffect(() => {
    api
      .get<BusinessResponse>(path)
      .then(setData)
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load business analytics"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  if (!data) return null;

  const { business } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Users className="size-5" />} label="Registered users" value={business.registeredUsers.toLocaleString("en-IN")} tone="primary" />
        <StatCard icon={<Users className="size-5" />} label="Anonymous visitors" value={business.anonymousUsers.toLocaleString("en-IN")} tone="accent" delay={0.05} />
        <StatCard icon={<UserCheck className="size-5" />} label="Active users" value={business.activeUsers.toLocaleString("en-IN")} tone="success" delay={0.1} />
        <StatCard icon={<UserX className="size-5" />} label="Inactive users" value={business.inactiveUsers.toLocaleString("en-IN")} tone="warning" delay={0.15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={<UserPlus className="size-5" />} label="New registered today" value={business.newRegisteredUsersToday.toLocaleString("en-IN")} tone="success" />
        <StatCard icon={<UserPlus className="size-5" />} label="New anonymous today" value={business.newAnonymousUsersToday.toLocaleString("en-IN")} tone="accent" delay={0.05} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion funnel</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">{business.conversionRates.visitorToRegistration}%</p>
              <p className="text-muted-foreground text-xs">Visitor → Registration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success flex size-10 items-center justify-center rounded-xl">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">{business.conversionRates.registrationToLogin}%</p>
              <p className="text-muted-foreground text-xs">Registration → Login</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 text-accent flex size-10 items-center justify-center rounded-xl">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">{business.conversionRates.loginToActivation}%</p>
              <p className="text-muted-foreground text-xs">Login → Activation (first checklist item)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={<Repeat className="size-5" />} label="Repeat users" value={`${business.repeatUsersRate}%`} hint="Logged in on more than one day" tone="primary" />
      </div>
    </div>
  );
}
