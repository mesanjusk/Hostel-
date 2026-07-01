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
