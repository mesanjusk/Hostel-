"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { wishlistItemSchema, wishlistItemUpdateSchema } from "@/lib/validations/wishlist";
import {
  createWishlistItem,
  deleteWishlistItem,
  updateWishlistItem,
} from "@/services/wishlistService";
import type { ActionResult } from "@/actions/profile";

export async function createWishlistItemAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = wishlistItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createWishlistItem(session.user.id, parsed.data);
  revalidatePath("/wishlist");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateWishlistItemAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = wishlistItemUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateWishlistItem(session.user.id, parsed.data);
  revalidatePath("/wishlist");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteWishlistItemAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  await deleteWishlistItem(session.user.id, id);
  revalidatePath("/wishlist");
  revalidatePath("/dashboard");
  return { success: true };
}
