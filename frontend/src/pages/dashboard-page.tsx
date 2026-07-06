import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { useAuth } from "@/context/auth-context";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import {
  toDashboardDataDTO,
  type DashboardDataDTO,
  type DashboardDataRaw,
} from "@/features/dashboard/dashboard-dto";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardDataDTO | null>(null);

  async function fetchData() {
    try {
      const raw = await api.get<DashboardDataRaw>("/api/dashboard");
      setData(toDashboardDataDTO(raw));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load dashboard");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;

  return <DashboardView data={data} name={user?.name ?? null} />;
}
