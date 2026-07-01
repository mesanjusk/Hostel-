"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { onboardingSchema } from "@/lib/validations/auth";
import { profileUpdateSchema } from "@/lib/validations/profile";
import {
  completeOnboarding,
  setNotificationPreference,
  updateProfile,
} from "@/services/userService";
import { seedDefaultChecklistIfEmpty } from "@/services/checklistService";

export type ActionResult = { success: true } | { success: false; error: string };

export async function completeOnboardingAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await completeOnboarding(session.user.id, parsed.data);
  await seedDefaultChecklistIfEmpty(session.user.id);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateProfile(session.user.id, parsed.data);
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function setNotificationPreferenceAction(
  enabled: boolean,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  await setNotificationPreference(session.user.id, enabled);
  revalidatePath("/profile");
  return { success: true };
}
