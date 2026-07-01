"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { noteSchema, noteUpdateSchema } from "@/lib/validations/note";
import { createNote, deleteNote, updateNote } from "@/services/noteService";
import type { ActionResult } from "@/actions/profile";

export async function createNoteAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createNote(session.user.id, parsed.data);
  revalidatePath("/notes");
  return { success: true };
}

export async function updateNoteAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = noteUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateNote(session.user.id, parsed.data);
  revalidatePath("/notes");
  return { success: true };
}

export async function deleteNoteAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  await deleteNote(session.user.id, id);
  revalidatePath("/notes");
  return { success: true };
}
