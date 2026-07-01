"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  productSchema,
  productUpdateSchema,
  guideArticleSchema,
  guideArticleUpdateSchema,
  broadcastSchema,
} from "@/lib/validations/admin";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/services/productService";
import {
  createGuideArticle,
  deleteGuideArticle,
  updateGuideArticle,
} from "@/services/guideService";
import { listBroadcastRecipients } from "@/services/userService";
import { recordBroadcast } from "@/services/broadcastService";
import { sendTextMessage } from "@/lib/whatsapp";
import type { ActionResult } from "@/actions/profile";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function createProductAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Not authorized" };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createProduct(parsed.data);
  revalidatePath("/admin/products");
  revalidatePath("/shopping");
  return { success: true };
}

export async function updateProductAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Not authorized" };

  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateProduct(parsed.data);
  revalidatePath("/admin/products");
  revalidatePath("/shopping");
  return { success: true };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Not authorized" };

  await deleteProduct(id);
  revalidatePath("/admin/products");
  revalidatePath("/shopping");
  return { success: true };
}

export async function createGuideArticleAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Not authorized" };

  const parsed = guideArticleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createGuideArticle(parsed.data);
  revalidatePath("/admin/guide");
  revalidatePath("/guide");
  return { success: true };
}

export async function updateGuideArticleAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Not authorized" };

  const parsed = guideArticleUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateGuideArticle(parsed.data);
  revalidatePath("/admin/guide");
  revalidatePath("/guide");
  return { success: true };
}

export async function deleteGuideArticleAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Not authorized" };

  await deleteGuideArticle(id);
  revalidatePath("/admin/guide");
  revalidatePath("/guide");
  return { success: true };
}

export async function sendBroadcastAction(
  input: unknown,
): Promise<ActionResult & { sentCount?: number; failedCount?: number }> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Not authorized" };

  const parsed = broadcastSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const recipients = await listBroadcastRecipients(parsed.data.audience);

  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    const result = await sendTextMessage(recipient.mobile, parsed.data.message);
    if (result.success) {
      sentCount += 1;
    } else {
      failedCount += 1;
    }
  }

  await recordBroadcast(session.user.id, parsed.data, sentCount, failedCount);
  revalidatePath("/admin/broadcast");

  return { success: true, sentCount, failedCount };
}
