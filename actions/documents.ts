"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { documentItemSchema, documentItemUpdateSchema } from "@/lib/validations/document";
import { createDocument, deleteDocument, updateDocument } from "@/services/documentService";
import type { ActionResult } from "@/actions/profile";

export async function createDocumentAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = documentItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createDocument(session.user.id, parsed.data);
  revalidatePath("/documents");
  return { success: true };
}

export async function updateDocumentAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = documentItemUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateDocument(session.user.id, parsed.data);
  revalidatePath("/documents");
  return { success: true };
}

export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  await deleteDocument(session.user.id, id);
  revalidatePath("/documents");
  return { success: true };
}
