import { connectDB } from "@/db";
import { BudgetEntry } from "@/models/BudgetEntry";
import type { BudgetEntryInput, BudgetEntryUpdateInput } from "@/validations/budget";

export async function listBudgetEntries(userId: string) {
  await connectDB();
  return BudgetEntry.find({ userId }).sort({ date: -1 }).lean();
}

export async function getBudgetSummary(userId: string) {
  await connectDB();
  const entries = await BudgetEntry.find({ userId }).lean();

  const planned = entries
    .filter((e) => e.type === "planned")
    .reduce((sum, e) => sum + e.amount, 0);
  const spent = entries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const byCategory = entries
    .filter((e) => e.type === "expense")
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {});

  return { planned, spent, remaining: planned - spent, byCategory };
}

export async function createBudgetEntry(userId: string, input: BudgetEntryInput) {
  await connectDB();
  return BudgetEntry.create({ userId, ...input });
}

export async function updateBudgetEntry(userId: string, input: BudgetEntryUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return BudgetEntry.findOneAndUpdate({ _id: id, userId }, rest, { returnDocument: "after" }).lean();
}

export async function deleteBudgetEntry(userId: string, id: string) {
  await connectDB();
  return BudgetEntry.deleteOne({ _id: id, userId });
}
