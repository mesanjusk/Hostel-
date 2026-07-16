import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, peekCache } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { useAuth } from "@/context/auth-context";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { useDashboardLayout } from "@/features/dashboard/use-dashboard-layout";
import {
  toDashboardDataDTO,
  type DashboardDataDTO,
  type DashboardDataRaw,
} from "@/features/dashboard/dashboard-dto";

const DASHBOARD_PATH = "/api/dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardDataDTO | null>(() => {
    const cached = peekCache<DashboardDataRaw>(DASHBOARD_PATH);
    return cached ? toDashboardDataDTO(cached) : null;
  });
  const layout = useDashboardLayout();

  async function fetchData() {
    try {
      const raw = await api.get<DashboardDataRaw>(DASHBOARD_PATH);
      setData(toDashboardDataDTO(raw));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load dashboard");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  if (!data) return null;

  return <DashboardView data={data} name={user?.name ?? null} layout={layout} />;
}
