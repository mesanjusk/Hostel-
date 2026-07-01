import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getBudgetSummary, listBudgetEntries } from "@/services/budgetService";
import { toPlain } from "@/lib/serialize";
import { BudgetView } from "@/features/budget/budget-view";
import type { BudgetEntryDTO } from "@/features/budget/budget-dto";

export const metadata: Metadata = { title: "Budget & Expenses — Hostel Essentials" };

export default async function BudgetPage() {
  const session = await auth();
  const [entries, summary] = await Promise.all([
    listBudgetEntries(session!.user.id),
    getBudgetSummary(session!.user.id),
  ]);

  const initialEntries: BudgetEntryDTO[] = toPlain(entries).map((e) => ({
    id: e._id,
    title: e.title,
    amount: e.amount,
    category: e.category,
    type: e.type,
    date: e.date,
  }));

  return <BudgetView initialEntries={initialEntries} summary={summary} />;
}
