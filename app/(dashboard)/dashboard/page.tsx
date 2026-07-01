import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getUserById } from "@/services/userService";
import { getDashboardData } from "@/services/dashboardService";
import { toPlain } from "@/lib/serialize";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import type { DashboardDataDTO } from "@/features/dashboard/dashboard-dto";

export const metadata: Metadata = { title: "Dashboard — Hostel Essentials" };

export default async function DashboardPage() {
  const session = await auth();
  const [user, data] = await Promise.all([
    getUserById(session!.user.id),
    getDashboardData(session!.user.id),
  ]);

  const plain = toPlain(data);

  const dashboardData: DashboardDataDTO = {
    categorySummaries: plain.categorySummaries,
    overallProgress: plain.overallProgress,
    budgetSummary: plain.budgetSummary,
    wishlistCount: plain.wishlistCount,
    upcomingTasks: plain.upcomingTasks.map((t) => ({
      id: t._id,
      item: t.item,
      category: t.category,
      priority: t.priority,
    })),
    activity: plain.activity.map((a) => ({
      id: a.id,
      type: a.type,
      label: a.label,
      timestamp: a.timestamp,
    })),
  };

  return <DashboardView data={dashboardData} name={user?.name ?? null} />;
}
