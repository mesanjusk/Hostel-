import "server-only";

import { connectDB } from "@/lib/db";
import { ChecklistItem } from "@/models/ChecklistItem";
import { CHECKLIST_CATEGORIES, type ChecklistCategory, type ChecklistPriority } from "@/types";
import type { ChecklistItemInput, ChecklistItemUpdateInput } from "@/lib/validations/checklist";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/default-checklist-template";
import { areNearDuplicateNames } from "@/lib/text-similarity";

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

/** All items for a user, grouped by category — for the expandable accordion overview. */
export async function getAllItemsByCategory(userId: string) {
  await connectDB();
  const items = await ChecklistItem.find({ userId }).sort({ createdAt: -1 }).lean();

  return CHECKLIST_CATEGORIES.map((category) => ({
    category,
    items: items.filter((i) => i.category === category),
  }));
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

/** Adds any starter-template items the user doesn't already have (by category + item name). */
export async function addMissingTemplateItems(userId: string) {
  await connectDB();

  const existing = await ChecklistItem.find({ userId }).select("category item").lean();
  const existingKeys = new Set(
    existing.map((i) => `${i.category}::${i.item.trim().toLowerCase()}`),
  );

  const missing = DEFAULT_CHECKLIST_TEMPLATE.filter(
    (template) => !existingKeys.has(`${template.category}::${template.item.trim().toLowerCase()}`),
  );

  if (missing.length === 0) {
    return { count: 0 };
  }

  await ChecklistItem.insertMany(missing.map((template) => ({ userId, ...template })));
  return { count: missing.length };
}

export async function createChecklistItem(userId: string, input: ChecklistItemInput) {
  await connectDB();
  return ChecklistItem.create({ userId, ...input });
}

/** Adds several items to one category in a single insert, skipping names already present. */
export async function createChecklistItems(
  userId: string,
  category: ChecklistCategory,
  names: string[],
  priority: ChecklistPriority,
) {
  await connectDB();

  const existing = await ChecklistItem.find({ userId, category }).select("item").lean();
  const existingNames = existing.map((i) => i.item);

  const seen: string[] = [];
  const docs: { userId: string; category: ChecklistCategory; item: string; priority: ChecklistPriority }[] = [];

  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;
    const isDuplicate = [...existingNames, ...seen].some((other) =>
      areNearDuplicateNames(name, other),
    );
    if (isDuplicate) continue;
    seen.push(name);
    docs.push({ userId, category, item: name, priority });
  }

  if (docs.length === 0) {
    return { count: 0, skipped: names.length };
  }

  await ChecklistItem.insertMany(docs);
  return { count: docs.length, skipped: names.length - docs.length };
}

export async function updateChecklistItem(userId: string, input: ChecklistItemUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return ChecklistItem.findOneAndUpdate({ _id: id, userId }, rest, { returnDocument: "after" }).lean();
}

export async function renameChecklistItem(userId: string, id: string, item: string) {
  await connectDB();
  return ChecklistItem.findOneAndUpdate({ _id: id, userId }, { item }, { returnDocument: "after" }).lean();
}

/** Finds near-duplicate items within each category (typos/pluralization like "Fee Reciept" vs "Fee Receipts") and merges each group into the oldest item, deleting the rest. */
export async function mergeDuplicateItems(userId: string) {
  await connectDB();

  const items = await ChecklistItem.find({ userId }).sort({ createdAt: 1 }).lean();
  const idsToDelete: string[] = [];
  const idsToComplete: string[] = [];

  for (const category of CHECKLIST_CATEGORIES) {
    const inCategory = items.filter((i) => i.category === category);
    const grouped: (typeof inCategory)[number][][] = [];

    for (const current of inCategory) {
      const group = grouped.find((g) => areNearDuplicateNames(g[0].item, current.item));
      if (group) {
        group.push(current);
      } else {
        grouped.push([current]);
      }
    }

    for (const group of grouped) {
      if (group.length < 2) continue;
      const [keep, ...rest] = group;
      idsToDelete.push(...rest.map((r) => String(r._id)));
      if (group.some((g) => g.completed) && !keep.completed) {
        idsToComplete.push(String(keep._id));
      }
    }
  }

  if (idsToDelete.length > 0) {
    await ChecklistItem.deleteMany({ _id: { $in: idsToDelete }, userId });
  }
  if (idsToComplete.length > 0) {
    await ChecklistItem.updateMany({ _id: { $in: idsToComplete }, userId }, { completed: true });
  }

  return { mergedCount: idsToDelete.length };
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
