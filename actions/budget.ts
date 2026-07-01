"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { budgetEntrySchema, budgetEntryUpdateSchema } from "@/lib/validations/budget";
import {
  createBudgetEntry,
  deleteBudgetEntry,
  updateBudgetEntry,
} from "@/services/budgetService";
import type { ActionResult } from "@/actions/profile";

export async function createBudgetEntryAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = budgetEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createBudgetEntry(session.user.id, parsed.data);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateBudgetEntryAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = budgetEntryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateBudgetEntry(session.user.id, parsed.data);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBudgetEntryAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  await deleteBudgetEntry(session.user.id, id);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { success: true };
}
