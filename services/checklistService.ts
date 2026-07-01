import "server-only";

import { connectDB } from "@/lib/db";
import { ChecklistItem } from "@/models/ChecklistItem";
import { CHECKLIST_CATEGORIES, type ChecklistCategory } from "@/types";
import type { ChecklistItemInput, ChecklistItemUpdateInput } from "@/lib/validations/checklist";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/default-checklist-template";

export async function getCategorySummaries(userId: string) {
  await connectDB();
  const items = await ChecklistItem.find({ userId }).select("category completed").lean();

  return CHECKLIST_CATEGORIES.map((category) => {
    const inCategory = items.filter((i) => i.category === category);
    const completed = inCategory.filter((i) => i.completed).length;
    return {
      category,
      total: inCategory.length,
      completed,
    };
  });
}

export async function getOverallProgress(userId: string) {
  await connectDB();
  const [total, completed] = await Promise.all([
    ChecklistItem.countDocuments({ userId }),
    ChecklistItem.countDocuments({ userId, completed: true }),
  ]);
  return { total, completed };
}

export async function listItemsByCategory(userId: string, category: ChecklistCategory) {
  await connectDB();
  return ChecklistItem.find({ userId, category }).sort({ createdAt: -1 }).lean();
}

/** Idempotent: only seeds the starter checklist if the user has no items yet. */
export async function seedDefaultChecklistIfEmpty(userId: string) {
  await connectDB();

  const existingCount = await ChecklistItem.countDocuments({ userId });
  if (existingCount > 0) {
    return { seeded: false, count: 0 };
  }

  const docs = DEFAULT_CHECKLIST_TEMPLATE.map((template) => ({ userId, ...template }));
  await ChecklistItem.insertMany(docs);

  return { seeded: true, count: docs.length };
}

export async function createChecklistItem(userId: string, input: ChecklistItemInput) {
  await connectDB();
  return ChecklistItem.create({ userId, ...input });
}

export async function updateChecklistItem(userId: string, input: ChecklistItemUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return ChecklistItem.findOneAndUpdate({ _id: id, userId }, rest, { returnDocument: "after" }).lean();
}

export async function deleteChecklistItem(userId: string, id: string) {
  await connectDB();
  return ChecklistItem.deleteOne({ _id: id, userId });
}

export async function bulkUpdateItems(
  userId: string,
  ids: string[],
  action: "complete" | "incomplete" | "delete" | "duplicate",
) {
  await connectDB();

  if (action === "delete") {
    return ChecklistItem.deleteMany({ _id: { $in: ids }, userId });
  }

  if (action === "complete" || action === "incomplete") {
    return ChecklistItem.updateMany(
      { _id: { $in: ids }, userId },
      { completed: action === "complete" },
    );
  }

  if (action === "duplicate") {
    const items = await ChecklistItem.find({ _id: { $in: ids }, userId }).lean();
    const copies = items.map((doc) => ({
      userId: doc.userId,
      category: doc.category,
      item: doc.item,
      description: doc.description,
      imageUrl: doc.imageUrl,
      priority: doc.priority,
      price: doc.price,
      priceRangeMin: doc.priceRangeMin,
      priceRangeMax: doc.priceRangeMax,
      recommendedBrand: doc.recommendedBrand,
      recommendedStore: doc.recommendedStore,
      purchaseLink: doc.purchaseLink,
      studentRating: doc.studentRating,
      importance: doc.importance,
      completed: false,
    }));
    if (copies.length > 0) {
      await ChecklistItem.insertMany(copies);
    }
    return { insertedCount: copies.length };
  }
}
