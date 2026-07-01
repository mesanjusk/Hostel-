"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { emergencyContactSchema, emergencyContactUpdateSchema } from "@/lib/validations/contact";
import { createContact, deleteContact, updateContact } from "@/services/contactService";
import type { ActionResult } from "@/actions/profile";

export async function createContactAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = emergencyContactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createContact(session.user.id, parsed.data);
  revalidatePath("/contacts");
  return { success: true };
}

export async function updateContactAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = emergencyContactUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateContact(session.user.id, parsed.data);
  revalidatePath("/contacts");
  return { success: true };
}

export async function deleteContactAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  await deleteContact(session.user.id, id);
  revalidatePath("/contacts");
  return { success: true };
}
