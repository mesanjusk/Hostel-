import { connectDB } from "@/db";
import { ChecklistItem } from "@/models/ChecklistItem";
import { Bag } from "@/models/Bag";
import type { ChecklistCategory, ChecklistPriority } from "@/types";
import type { ChecklistItemInput, ChecklistItemUpdateInput } from "@/validations/checklist";
import { areNearDuplicateNames } from "@/lib/textSimilarity";
import { listCategories } from "@/services/categoryService";
import * as userChecklistService from "@/services/userChecklistService";

/** Every read/write entry point below is a thin router: legacy users (real ChecklistItem rows
 * from before the DB-driven catalog existed) keep using that path completely unchanged; every
 * other user — including a brand-new signup with zero UserChecklist rows, since nothing gets
 * materialized until they touch an item — is served from the live catalog merge in
 * userChecklistService.ts. The frontend hits the same endpoints and gets the same DTO shape
 * either way; only this file knows the difference. */

export async function getCategorySummaries(userId: string) {
  await connectDB();

  if (!(await userChecklistService.isLegacyChecklistUser(userId))) {
    const [categories, items] = await Promise.all([listCategories(userId), userChecklistService.listItemsForUser(userId)]);
    return categories.map(({ name: category }) => {
      const inCategory = items.filter((i) => i.category === category);
      return { category, total: inCategory.length, completed: inCategory.filter((i) => i.completed).length };
    });
  }

  const [categories, items] = await Promise.all([
    listCategories(userId),
    ChecklistItem.find({ userId }).select("category completed").lean(),
  ]);

  return categories.map(({ name: category }) => {
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

  if (!(await userChecklistService.isLegacyChecklistUser(userId))) {
    return userChecklistService.getOverallProgress(userId);
  }

  const [total, completed] = await Promise.all([
    ChecklistItem.countDocuments({ userId }),
    ChecklistItem.countDocuments({ userId, completed: true }),
  ]);
  return { total, completed };
}

export async function listItemsByCategory(userId: string, category: ChecklistCategory) {
  await connectDB();

  if (!(await userChecklistService.isLegacyChecklistUser(userId))) {
    const items = await userChecklistService.listItemsForUser(userId);
    return items.filter((i) => i.category === category);
  }

  return ChecklistItem.find({ userId, category }).sort({ createdAt: -1 }).lean();
}

/** All items for a user, grouped by category — for the expandable accordion overview.
 * Attaches `bagName`/`bagColor` alongside each item's `bagId` for display purposes only
 * (e.g. so the checklist row can render the assigned bag's color without a second
 * round-trip); the bag assignment itself still lives solely on the checklist item. */
export async function getAllItemsByCategory(userId: string) {
  await connectDB();

  const isLegacy = await userChecklistService.isLegacyChecklistUser(userId);
  const [categories, items, bags] = await Promise.all([
    listCategories(userId),
    isLegacy ? ChecklistItem.find({ userId }).sort({ createdAt: -1 }).lean() : userChecklistService.listItemsForUser(userId),
    Bag.find({ userId }).select("name color").lean(),
  ]);

  const bagById = new Map(bags.map((b) => [String(b._id), b]));
  const itemsWithBagInfo = items.map((item) => {
    const bag = item.bagId ? bagById.get(String(item.bagId)) : undefined;
    return {
      ...item,
      bagName: bag?.name ?? null,
      bagColor: bag?.color ?? null,
    };
  });

  return categories.map(({ name: category }) => ({
    category,
    items: itemsWithBagInfo.filter((i) => i.category === category),
  }));
}

export async function createChecklistItem(userId: string, input: ChecklistItemInput) {
  await connectDB();

  if (!(await userChecklistService.isLegacyChecklistUser(userId))) {
    // Custom items only carry a name/category/notes/bag — see UserChecklist's schema comment.
    // Any other field on the legacy create form (price, brand, priority, ...) is accepted but
    // not persisted for new-architecture users, since that metadata is admin-managed master
    // data now.
    return userChecklistService.createCustomItem(userId, {
      category: input.category,
      item: input.item,
      notes: input.notes,
      bagId: input.bagId ?? null,
    });
  }

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

  if (!(await userChecklistService.isLegacyChecklistUser(userId))) {
    return userChecklistService.createCustomItems(userId, category, names);
  }

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

  if (!(await userChecklistService.isLegacyChecklistUser(userId))) {
    return userChecklistService.updateItem(userId, id, rest);
  }

  return ChecklistItem.findOneAndUpdate({ _id: id, userId }, rest, { returnDocument: "after" }).lean();
}

export async function renameChecklistItem(userId: string, id: string, item: string) {
  await connectDB();

  if (!(await userChecklistService.isLegacyChecklistUser(userId))) {
    return userChecklistService.renameItem(userId, id, item);
  }

  return ChecklistItem.findOneAndUpdate({ _id: id, userId }, { item }, { returnDocument: "after" }).lean();
}

/** Finds near-duplicate items within each category and merges each group into the oldest item. */
export async function mergeDuplicateItems(userId: string) {
  await connectDB();

  const items = await ChecklistItem.find({ userId }).sort({ createdAt: 1 }).lean();
  const idsToDelete: string[] = [];
  const idsToComplete: string[] = [];
  const categoriesInUse = new Set(items.map((i) => i.category));

  for (const category of categoriesInUse) {
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

  if (!(await userChecklistService.isLegacyChecklistUser(userId))) {
    await userChecklistService.deleteItem(userId, id);
    return { acknowledged: true };
  }

  return ChecklistItem.deleteOne({ _id: id, userId });
}

export async function bulkUpdateItems(
  userId: string,
  ids: string[],
  action: "complete" | "incomplete" | "delete" | "duplicate",
) {
  await connectDB();

  if (!(await userChecklistService.isLegacyChecklistUser(userId))) {
    await userChecklistService.bulkUpdateItems(userId, ids, action);
    return { acknowledged: true };
  }

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
      bagId: doc.bagId,
      notes: doc.notes,
      priority: doc.priority,
      planType: doc.planType,
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
