import { z } from "zod";

import { BUDGET_CATEGORIES, BUDGET_ENTRY_TYPES } from "@/types";

export const budgetEntrySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  category: z.enum(BUDGET_CATEGORIES),
  type: z.enum(BUDGET_ENTRY_TYPES),
  date: z.coerce.date(),
});

export const budgetEntryUpdateSchema = budgetEntrySchema.partial().extend({
  id: z.string().min(1),
});

export type BudgetEntryInput = z.infer<typeof budgetEntrySchema>;
export type BudgetEntryUpdateInput = z.infer<typeof budgetEntryUpdateSchema>;
