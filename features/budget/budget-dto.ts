import type { BudgetCategory, BudgetEntryType } from "@/types";

export interface BudgetEntryDTO {
  id: string;
  title: string;
  amount: number;
  category: BudgetCategory;
  type: BudgetEntryType;
  date: string;
}
