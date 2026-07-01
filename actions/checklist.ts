"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  bulkActionSchema,
  bulkCreateItemsSchema,
  checklistItemSchema,
  checklistItemUpdateSchema,
  quickRenameItemSchema,
} from "@/lib/validations/checklist";
import {
  addMissingTemplateItems,
  bulkUpdateItems,
  createChecklistItem,
  createChecklistItems,
  deleteChecklistItem,
  mergeDuplicateItems,
  renameChecklistItem,
  updateChecklistItem,
} from "@/services/checklistService";
import type { ActionResult } from "@/actions/profile";

export type LoadStarterChecklistResult =
  | { success: true; count: number }
  | { success: false; error: string };

export type BulkCreateItemsResult =
  | { success: true; count: number; skipped: number }
  | { success: false; error: string };

export type MergeDuplicatesResult =
  | { success: true; mergedCount: number }
  | { success: false; error: string };

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

export async function renameChecklistItemAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = quickRenameItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await renameChecklistItem(session.user.id, parsed.data.id, parsed.data.item);
  revalidatePath("/checklist");
  return { success: true };
}

export async function bulkCreateChecklistItemsAction(
  input: unknown,
): Promise<BulkCreateItemsResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = bulkCreateItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { count, skipped } = await createChecklistItems(
    session.user.id,
    parsed.data.category,
    parsed.data.names,
    parsed.data.priority,
  );
  revalidatePath("/checklist");
  return { success: true, count, skipped };
}

export async function mergeDuplicateChecklistItemsAction(): Promise<MergeDuplicatesResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const { mergedCount } = await mergeDuplicateItems(session.user.id);
  revalidatePath("/checklist");
  return { success: true, mergedCount };
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

export async function loadStarterChecklistAction(): Promise<LoadStarterChecklistResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const { count } = await addMissingTemplateItems(session.user.id);
  revalidatePath("/checklist");
  return { success: true, count };
}
