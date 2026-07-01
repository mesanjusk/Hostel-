"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  bulkActionSchema,
  checklistItemSchema,
  checklistItemUpdateSchema,
} from "@/lib/validations/checklist";
import {
  bulkUpdateItems,
  createChecklistItem,
  deleteChecklistItem,
  updateChecklistItem,
} from "@/services/checklistService";
import type { ActionResult } from "@/actions/profile";

export async function createChecklistItemAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = checklistItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createChecklistItem(session.user.id, parsed.data);
  revalidatePath("/checklist");
  revalidatePath(`/checklist/${encodeURIComponent(parsed.data.category)}`);
  return { success: true };
}

export async function updateChecklistItemAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = checklistItemUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateChecklistItem(session.user.id, parsed.data);
  revalidatePath("/checklist");
  if (parsed.data.category) {
    revalidatePath(`/checklist/${encodeURIComponent(parsed.data.category)}`);
  }
  return { success: true };
}

export async function deleteChecklistItemAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  await deleteChecklistItem(session.user.id, id);
  revalidatePath("/checklist");
  return { success: true };
}

export async function bulkChecklistAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = bulkActionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await bulkUpdateItems(session.user.id, parsed.data.ids, parsed.data.action);
  revalidatePath("/checklist");
  return { success: true };
}
