import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, KeyRound, MessageCircle, AlertTriangle, UserX, Calendar, CalendarDays, CalendarRange } from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/shared/stat-card";
import { api, ApiError, peekCache } from "@/lib/api";
import type { DateRangeValue } from "@/features/admin-analytics/date-range-filter";
import type { LoginResponse } from "@/features/admin-analytics/analytics-dto";

export function LoginTab({ range }: { range: DateRangeValue }) {
  const path = `/api/analytics/login?from=${range.from}&to=${range.to}`;
  const [data, setData] = useState<LoginResponse | null>(() => peekCache(path) ?? null);

  useEffect(() => {
    api
      .get<LoginResponse>(path)
      .then(setData)
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load login analytics"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  if (!data) return null;

  const { login } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<CheckCircle2 className="size-5" />} label="Successful logins" value={login.loginSuccess.toLocaleString("en-IN")} tone="success" />
        <StatCard icon={<XCircle className="size-5" />} label="Failed logins" value={login.loginFailed.toLocaleString("en-IN")} tone="destructive" delay={0.05} />
        <StatCard icon={<KeyRound className="size-5" />} label="Forgot-code requests" value={login.forgotPasswordRequests.toLocaleString("en-IN")} tone="warning" delay={0.1} />
        <StatCard icon={<MessageCircle className="size-5" />} label="OTP login (reset) success" value={login.otpLoginSuccess.toLocaleString("en-IN")} tone="accent" delay={0.15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Calendar className="size-5" />} label="Daily active users" value={login.dailyActiveUsers.toLocaleString("en-IN")} tone="primary" />
        <StatCard icon={<CalendarDays className="size-5" />} label="Weekly active users" value={login.weeklyActiveUsers.toLocaleString("en-IN")} tone="success" delay={0.05} />
        <StatCard icon={<CalendarRange className="size-5" />} label="Monthly active users" value={login.monthlyActiveUsers.toLocaleString("en-IN")} tone="accent" delay={0.1} />
        <StatCard icon={<UserX className="size-5" />} label="Inactive users (30d)" value={login.inactiveUsers.toLocaleString("en-IN")} tone="warning" delay={0.15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={<AlertTriangle className="size-5" />} label="Users with 3+ failed attempts" value={login.usersWithMultipleFailedAttempts.toLocaleString("en-IN")} tone="destructive" />
        <StatCard icon={<CheckCircle2 className="size-5" />} label="Total registered users" value={login.totalRegisteredUsers.toLocaleString("en-IN")} tone="primary" delay={0.05} />
        <StatCard icon={<CheckCircle2 className="size-5" />} label="Total anonymous visitors" value={login.totalAnonymousUsers.toLocaleString("en-IN")} tone="accent" delay={0.1} />
      </div>
    </div>
  );
}
