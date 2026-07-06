import type { BudgetCategory, BudgetEntryType } from "@/types";

export interface BudgetEntryDTO {
  id: string;
  title: string;
  amount: number;
  category: BudgetCategory;
  type: BudgetEntryType;
  date: string;
}

export interface BudgetSummary {
  planned: number;
  spent: number;
  remaining: number;
  byCategory: Record<string, number>;
}

/** Raw shape returned by the API (Mongo doc with `_id`). */
export interface BudgetEntryRaw {
  _id: string;
  title: string;
  amount: number;
  category: BudgetCategory;
  type: BudgetEntryType;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export function toBudgetEntryDTO(raw: BudgetEntryRaw): BudgetEntryDTO {
  return {
    id: raw._id,
    title: raw.title,
    amount: raw.amount,
    category: raw.category,
    type: raw.type,
    date: raw.date,
  };
}
