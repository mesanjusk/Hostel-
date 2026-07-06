import type { ChecklistCategory, ChecklistPriority } from "@/types";

export interface CategorySummaryDTO {
  category: ChecklistCategory;
  total: number;
  completed: number;
}

export interface UpcomingTaskDTO {
  id: string;
  item: string;
  category: ChecklistCategory;
  priority: ChecklistPriority;
}

export interface ActivityDTO {
  id: string;
  type: "checklist" | "budget" | "note";
  label: string;
  timestamp: string;
}

export interface DashboardDataDTO {
  categorySummaries: CategorySummaryDTO[];
  overallProgress: { total: number; completed: number };
  budgetSummary: {
    planned: number;
    spent: number;
    remaining: number;
    byCategory: Record<string, number>;
  };
  wishlistCount: number;
  upcomingTasks: UpcomingTaskDTO[];
  activity: ActivityDTO[];
}

/** Raw shape returned by GET /api/dashboard. */
export interface DashboardDataRaw {
  categorySummaries: CategorySummaryDTO[];
  overallProgress: { total: number; completed: number };
  budgetSummary: {
    planned: number;
    spent: number;
    remaining: number;
    byCategory: Record<string, number>;
  };
  wishlistCount: number;
  upcomingTasks: { _id: string; item: string; category: ChecklistCategory; priority: ChecklistPriority }[];
  activity: { id: string; type: "checklist" | "budget" | "note"; label: string; timestamp: string }[];
}

export function toDashboardDataDTO(raw: DashboardDataRaw): DashboardDataDTO {
  return {
    categorySummaries: raw.categorySummaries,
    overallProgress: raw.overallProgress,
    budgetSummary: raw.budgetSummary,
    wishlistCount: raw.wishlistCount,
    upcomingTasks: raw.upcomingTasks.map((t) => ({
      id: t._id,
      item: t.item,
      category: t.category,
      priority: t.priority,
    })),
    activity: raw.activity,
  };
}
