import { connectDB } from "@/db";
import { ChecklistItem } from "@/models/ChecklistItem";
import { Bag } from "@/models/Bag";
import { User } from "@/models/User";
import { UserChecklist, type UserChecklistDocument } from "@/models/UserChecklist";
import { DefaultChecklistItem, type DefaultChecklistItemDocument } from "@/models/DefaultChecklistItem";
import { activeDefaultItemsForUser } from "@/services/checklistMasterService";
import type { ChecklistCategory, ChecklistPriority } from "@/types";
import type { ChecklistItemInput, ChecklistItemUpdateInput } from "@/validations/checklist";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/defaultChecklistTemplate";
import { areNearDuplicateNames } from "@/lib/textSimilarity";
import { listCategories } from "@/services/categoryService";

type LeanUserChecklist = UserChecklistDocument & { _id: unknown; createdAt?: Date; updatedAt?: Date };
type LeanDefaultChecklistItem = DefaultChecklistItemDocument & { _id: unknown; __v?: number };
type ChecklistResponseItem = {
  _id: unknown; userId: unknown; category: string; item: string; description: string; imageUrl: string | null;
  bagId: unknown | null; notes: string; completed: boolean; priority: ChecklistPriority; price: number | null;
  recommendedBrand: string | null; recommendedStore: string | null; purchaseLink: string | null; importance: string;
  bagName?: string | null; bagColor?: string | null; createdAt?: Date; updatedAt?: Date;
};

const DESIGN_ONLY_CATEGORY = "Fashion Design Tools";

function mapUserChecklistItem(doc: LeanUserChecklist, master?: LeanDefaultChecklistItem | null, bag?: { name: string; color?: string | null }): ChecklistResponseItem {
  const isCustom = doc.isCustomItem || !master;
  return {
    _id: doc._id,
    userId: doc.userId,
    category: isCustom ? (doc.customCategory ?? "Miscellaneous") : master.category,
    item: isCustom ? (doc.customName ?? "Untitled item") : master.title,
    description: isCustom ? "" : (master.description ?? ""),
    imageUrl: isCustom ? null : (master.image ?? null),
    bagId: doc.bagId ?? null,
    notes: doc.note ?? "",
    completed: Boolean(doc.checked),
    priority: isCustom ? "medium" : (master.priority as ChecklistPriority),
    price: isCustom ? null : (master.estimatedPrice ?? null),
    recommendedBrand: isCustom ? null : (master.recommendedBrand ?? null),
    recommendedStore: isCustom ? null : (master.recommendedStore ?? null),
    purchaseLink: isCustom ? null : (master.purchaseLink ?? null),
    importance: isCustom ? "" : (master.importance ?? ""),
    bagName: bag?.name ?? null,
    bagColor: bag?.color ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function userUsesNormalizedChecklist(userId: string) {
  return (await UserChecklist.countDocuments({ userId })) > 0;
}

async function getTemplateForUser(userId: string) {
  const user = await User.findById(userId).select("collegeCategory").lean();
  if (user?.collegeCategory === "Designing" || user?.collegeCategory === "Design") return DEFAULT_CHECKLIST_TEMPLATE;
  return DEFAULT_CHECKLIST_TEMPLATE.filter((item) => item.category !== DESIGN_ONLY_CATEGORY);
}

export async function listNormalizedChecklistItems(userId: string, options: { category?: string; bagId?: string; limit?: number; incompleteOnly?: boolean } = {}) {
  await connectDB();
  const query: Record<string, unknown> = { userId, deleted: false };
  if (options.bagId) query.bagId = options.bagId;
  if (options.incompleteOnly) query.checked = false;

  const rows = await UserChecklist.find(query)
    .populate<{ defaultChecklistItemId: LeanDefaultChecklistItem | null }>("defaultChecklistItemId")
    .sort({ customOrder: 1, createdAt: -1 })
    .limit(options.limit ?? 0)
    .lean();

  const bagIds = [...new Set(rows.map((row) => row.bagId).filter(Boolean).map(String))];
  const bags = bagIds.length ? await Bag.find({ userId, _id: { $in: bagIds } }).select("name color").lean() : [];
  const bagById = new Map(bags.map((bag) => [String(bag._id), bag]));
  const items = rows.map((row) => mapUserChecklistItem(row as LeanUserChecklist, row.defaultChecklistItemId, row.bagId ? bagById.get(String(row.bagId)) : undefined));
  return options.category ? items.filter((item) => item.category === options.category) : items;
}

export async function getCategorySummaries(userId: string) {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) {
    const items = await listNormalizedChecklistItems(userId);
    const categories = [...new Set(items.map((item) => item.category))];
    return categories.map((category) => {
      const inCategory = items.filter((item) => item.category === category);
      return { category, total: inCategory.length, completed: inCategory.filter((item) => item.completed).length };
    });
  }

  const [categories, items] = await Promise.all([
    listCategories(userId),
    ChecklistItem.find({ userId }).select("category completed").lean(),
  ]);

  return categories.map(({ name: category }) => {
    const inCategory = items.filter((i) => i.category === category);
    return { category, total: inCategory.length, completed: inCategory.filter((i) => i.completed).length };
  });
}

export async function getOverallProgress(userId: string) {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) {
    const [total, completed] = await Promise.all([
      UserChecklist.countDocuments({ userId, deleted: false }),
      UserChecklist.countDocuments({ userId, deleted: false, checked: true }),
    ]);
    return { total, completed };
  }
  const [total, completed] = await Promise.all([
    ChecklistItem.countDocuments({ userId }),
    ChecklistItem.countDocuments({ userId, completed: true }),
  ]);
  return { total, completed };
}

export async function listItemsByCategory(userId: string, category: ChecklistCategory) {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) return listNormalizedChecklistItems(userId, { category });
  return ChecklistItem.find({ userId, category }).sort({ createdAt: -1 }).lean();
}

export async function getAllItemsByCategory(userId: string) {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) {
    const items = await listNormalizedChecklistItems(userId);
    const categories = [...new Set(items.map((item) => item.category))];
    return categories.map((category) => ({ category, items: items.filter((item) => item.category === category) }));
  }

  const [categories, items, bags] = await Promise.all([
    listCategories(userId),
    ChecklistItem.find({ userId }).sort({ createdAt: -1 }).lean(),
    Bag.find({ userId }).select("name color").lean(),
  ]);

  const bagById = new Map(bags.map((b) => [String(b._id), b]));
  const itemsWithBagInfo = items.map((item) => {
    const bag = item.bagId ? bagById.get(String(item.bagId)) : undefined;
    return { ...item, bagName: bag?.name ?? null, bagColor: bag?.color ?? null };
  });

  return categories.map(({ name: category }) => ({ category, items: itemsWithBagInfo.filter((i) => i.category === category) }));
}

export async function seedDefaultChecklistIfEmpty(userId: string) {
  await connectDB();
  const [existingNewCount, existingLegacyCount, user] = await Promise.all([
    UserChecklist.countDocuments({ userId }),
    ChecklistItem.countDocuments({ userId }),
    User.findById(userId).lean(),
  ]);
  if (existingNewCount > 0 || existingLegacyCount > 0 || !user) return { seeded: false, count: 0 };

  const templateItems = await activeDefaultItemsForUser(user);
  const docs = templateItems.map((item) => ({
    userId,
    defaultChecklistItemId: item._id,
    checked: false,
    quantity: 1,
    note: "",
    metadataVersion: item.__v ?? 1,
    deleted: false,
  }));
  if (docs.length > 0) await UserChecklist.insertMany(docs, { ordered: false });
  return { seeded: true, count: docs.length };
}

export async function addMissingTemplateItems(userId: string) {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) {
    const user = await User.findById(userId).lean();
    if (!user) return { count: 0 };
    const [templateItems, existing] = await Promise.all([
      activeDefaultItemsForUser(user),
      UserChecklist.find({ userId, defaultChecklistItemId: { $ne: null } }).select("defaultChecklistItemId").lean(),
    ]);
    const existingIds = new Set(existing.map((item) => String(item.defaultChecklistItemId)));
    const docs = templateItems.filter((item) => !existingIds.has(String(item._id))).map((item) => ({ userId, defaultChecklistItemId: item._id, checked: false, quantity: 1, metadataVersion: item.__v ?? 1, deleted: false }));
    if (docs.length > 0) await UserChecklist.insertMany(docs, { ordered: false });
    return { count: docs.length };
  }

  const template = await getTemplateForUser(userId);
  const existing = await ChecklistItem.find({ userId }).select("category item").lean();
  const existingKeys = new Set(existing.map((i) => `${i.category}::${i.item.trim().toLowerCase()}`));
  const missing = template.filter((template) => !existingKeys.has(`${template.category}::${template.item.trim().toLowerCase()}`));
  if (missing.length === 0) return { count: 0 };
  await ChecklistItem.insertMany(missing.map((template) => ({ userId, ...template })));
  return { count: missing.length };
}

export async function createChecklistItem(userId: string, input: ChecklistItemInput) {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) {
    return UserChecklist.create({ userId, defaultChecklistItemId: null, isCustomItem: true, customName: input.item, customCategory: input.category, checked: false, quantity: 1, note: input.notes ?? "", bagId: input.bagId ?? null });
  }
  return ChecklistItem.create({ userId, ...input });
}

export async function createChecklistItems(userId: string, category: ChecklistCategory, names: string[], priority: ChecklistPriority) {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) {
    const existing = await listNormalizedChecklistItems(userId, { category });
    const existingNames = existing.map((i) => i.item);
    const seen: string[] = [];
    const docs: Array<{ userId: string; defaultChecklistItemId: null; isCustomItem: true; customName: string; customCategory: string; checked: false; quantity: 1 }> = [];
    for (const rawName of names) {
      const name = rawName.trim();
      if (!name || [...existingNames, ...seen].some((other) => areNearDuplicateNames(name, other))) continue;
      seen.push(name);
      docs.push({ userId, defaultChecklistItemId: null, isCustomItem: true, customName: name, customCategory: category, checked: false, quantity: 1 });
    }
    if (docs.length > 0) await UserChecklist.insertMany(docs);
    return { count: docs.length, skipped: names.length - docs.length };
  }

  const existing = await ChecklistItem.find({ userId, category }).select("item").lean();
  const existingNames = existing.map((i) => i.item);
  const seen: string[] = [];
  const docs: { userId: string; category: ChecklistCategory; item: string; priority: ChecklistPriority }[] = [];
  for (const rawName of names) {
    const name = rawName.trim();
    if (!name || [...existingNames, ...seen].some((other) => areNearDuplicateNames(name, other))) continue;
    seen.push(name);
    docs.push({ userId, category, item: name, priority });
  }
  if (docs.length === 0) return { count: 0, skipped: names.length };
  await ChecklistItem.insertMany(docs);
  return { count: docs.length, skipped: names.length - docs.length };
}

export async function updateChecklistItem(userId: string, input: ChecklistItemUpdateInput) {
  await connectDB();
  const { id, completed, notes, item, category, bagId, ...legacyRest } = input;
  if (await userUsesNormalizedChecklist(userId)) {
    return UserChecklist.findOneAndUpdate(
      { _id: id, userId },
      {
        ...(completed !== undefined ? { checked: completed } : {}),
        ...(notes !== undefined ? { note: notes } : {}),
        ...(item !== undefined ? { customName: item, isCustomItem: true, defaultChecklistItemId: null } : {}),
        ...(category !== undefined ? { customCategory: category, isCustomItem: true, defaultChecklistItemId: null } : {}),
        ...(bagId !== undefined ? { bagId } : {}),
      },
      { returnDocument: "after" },
    ).lean();
  }
  return ChecklistItem.findOneAndUpdate({ _id: id, userId }, { completed, notes, item, category, bagId, ...legacyRest }, { returnDocument: "after" }).lean();
}

export async function renameChecklistItem(userId: string, id: string, item: string) {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) {
    return UserChecklist.findOneAndUpdate({ _id: id, userId }, { customName: item, isCustomItem: true, defaultChecklistItemId: null }, { returnDocument: "after" }).lean();
  }
  return ChecklistItem.findOneAndUpdate({ _id: id, userId }, { item }, { returnDocument: "after" }).lean();
}

export async function mergeDuplicateItems(userId: string) {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) return { mergedCount: 0 };

  const items = await ChecklistItem.find({ userId }).sort({ createdAt: 1 }).lean();
  const idsToDelete: string[] = [];
  const idsToComplete: string[] = [];
  const categoriesInUse = new Set(items.map((i) => i.category));
  for (const category of categoriesInUse) {
    const inCategory = items.filter((i) => i.category === category);
    const grouped: (typeof inCategory)[number][][] = [];
    for (const current of inCategory) {
      const group = grouped.find((g) => areNearDuplicateNames(g[0].item, current.item));
      if (group) group.push(current); else grouped.push([current]);
    }
    for (const group of grouped) {
      if (group.length < 2) continue;
      const [keep, ...rest] = group;
      idsToDelete.push(...rest.map((r) => String(r._id)));
      if (group.some((g) => g.completed) && !keep.completed) idsToComplete.push(String(keep._id));
    }
  }
  if (idsToDelete.length > 0) await ChecklistItem.deleteMany({ _id: { $in: idsToDelete }, userId });
  if (idsToComplete.length > 0) await ChecklistItem.updateMany({ _id: { $in: idsToComplete }, userId }, { completed: true });
  return { mergedCount: idsToDelete.length };
}

export async function deleteChecklistItem(userId: string, id: string) {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) return UserChecklist.findOneAndUpdate({ _id: id, userId }, { deleted: true }, { returnDocument: "after" }).lean();
  return ChecklistItem.deleteOne({ _id: id, userId });
}

export async function bulkUpdateItems(userId: string, ids: string[], action: "complete" | "incomplete" | "delete" | "duplicate") {
  await connectDB();
  if (await userUsesNormalizedChecklist(userId)) {
    if (action === "delete") return UserChecklist.updateMany({ _id: { $in: ids }, userId }, { deleted: true });
    if (action === "complete" || action === "incomplete") return UserChecklist.updateMany({ _id: { $in: ids }, userId }, { checked: action === "complete" });
    const items = await UserChecklist.find({ _id: { $in: ids }, userId }).lean();
    const copies = items.map((doc) => ({ userId: doc.userId, defaultChecklistItemId: doc.defaultChecklistItemId, checked: false, quantity: doc.quantity, note: doc.note, bagId: doc.bagId, customName: doc.customName, customCategory: doc.customCategory, isCustomItem: doc.isCustomItem, customOrder: doc.customOrder, metadataVersion: doc.metadataVersion, deleted: false }));
    if (copies.length > 0) await UserChecklist.insertMany(copies, { ordered: false });
    return { insertedCount: copies.length };
  }

  if (action === "delete") return ChecklistItem.deleteMany({ _id: { $in: ids }, userId });
  if (action === "complete" || action === "incomplete") return ChecklistItem.updateMany({ _id: { $in: ids }, userId }, { completed: action === "complete" });
  const items = await ChecklistItem.find({ _id: { $in: ids }, userId }).lean();
  const copies = items.map((doc) => ({ userId: doc.userId, category: doc.category, item: doc.item, description: doc.description, imageUrl: doc.imageUrl, bagId: doc.bagId, notes: doc.notes, priority: doc.priority, price: doc.price, priceRangeMin: doc.priceRangeMin, priceRangeMax: doc.priceRangeMax, recommendedBrand: doc.recommendedBrand, recommendedStore: doc.recommendedStore, purchaseLink: doc.purchaseLink, studentRating: doc.studentRating, importance: doc.importance, completed: false }));
  if (copies.length > 0) await ChecklistItem.insertMany(copies);
  return { insertedCount: copies.length };
}
