import { connectDB } from "@/db";
import { UserChecklist } from "@/models/UserChecklist";
import { DefaultChecklistItem, type DefaultChecklistItemDocument } from "@/models/DefaultChecklistItem";
import { User } from "@/models/User";
import { getOrCreateActiveTemplate } from "@/services/checklistTemplateService";
import { findApplicableItems } from "@/services/defaultChecklistItemService";
import { areNearDuplicateNames, normalizeItemName } from "@/lib/textSimilarity";
import type { ChecklistCategory } from "@/types";

export async function hasUserChecklist(userId: string) {
  await connectDB();
  const count = await UserChecklist.countDocuments({ userId });
  return count > 0;
}

/** CHECKLIST GENERATION: idempotent — only seeds if the user has no UserChecklist rows yet
 * (checked regardless of `deleted`, so a user who cleared their generated list isn't re-seeded
 * behind their back). Loads the active template's items applicable to the user's college
 * category / course and bulk-inserts thin reference rows — no metadata is copied. */
export async function generateUserChecklist(userId: string) {
  await connectDB();

  const existingCount = await UserChecklist.countDocuments({ userId });
  if (existingCount > 0) {
    return { generated: false, count: 0 };
  }

  const user = await User.findById(userId).select("collegeCategoryId courseId gender").lean();
  const template = await getOrCreateActiveTemplate();
  const items = await findApplicableItems(
    String(template._id),
    user?.collegeCategoryId ? String(user.collegeCategoryId) : null,
    user?.courseId ? String(user.courseId) : null,
    user?.gender ?? null,
  );

  if (items.length === 0) {
    return { generated: true, count: 0 };
  }

  const docs = items.map((item) => ({
    userId,
    defaultChecklistItemId: item._id,
    checked: false,
    quantity: 1,
    metadataVersion: template.version,
  }));

  try {
    await UserChecklist.insertMany(docs, { ordered: false });
  } catch (error) {
    // Unique (userId, defaultChecklistItemId) index guards against double-seeding on races —
    // that's expected and fine. Anything else is a real failure and must not be swallowed
    // silently, or a user can be left with zero rows with no trace of why.
    console.error(`generateUserChecklist: insertMany failed for user ${userId}`, error);
  }

  const insertedCount = await UserChecklist.countDocuments({ userId });
  return { generated: true, count: insertedCount };
}

/** Called when a user changes their gender after onboarding (see userService.updateProfile).
 * generateUserChecklist only ever seeds once, so a user who initially onboarded with the
 * "wrong" gender would otherwise never receive items targeted at their corrected gender. Only
 * ADDS items newly applicable under the new gender — never removes items they already have,
 * since those may already be checked off or customized. No-ops for users who haven't been
 * seeded yet (they'll get the right items from generateUserChecklist on /onboarding). */
export async function backfillChecklistForGenderChange(userId: string) {
  await connectDB();

  const hasChecklist = await hasUserChecklist(userId);
  if (!hasChecklist) return { added: 0 };

  const user = await User.findById(userId).select("collegeCategoryId courseId gender").lean();
  const template = await getOrCreateActiveTemplate();
  const items = await findApplicableItems(
    String(template._id),
    user?.collegeCategoryId ? String(user.collegeCategoryId) : null,
    user?.courseId ? String(user.courseId) : null,
    user?.gender ?? null,
  );
  if (items.length === 0) return { added: 0 };

  const existingItemIds = await UserChecklist.distinct("defaultChecklistItemId", { userId });
  const existingIds = new Set(existingItemIds.map(String));

  const docs = items
    .filter((item) => !existingIds.has(String(item._id)))
    .map((item) => ({
      userId,
      defaultChecklistItemId: item._id,
      checked: false,
      quantity: 1,
      metadataVersion: template.version,
    }));
  if (docs.length === 0) return { added: 0 };

  try {
    await UserChecklist.insertMany(docs, { ordered: false });
  } catch (error) {
    console.error(`backfillChecklistForGenderChange: insertMany failed for user ${userId}`, error);
  }
  return { added: docs.length };
}

export interface HydratedChecklistRow {
  _id: string;
  category: ChecklistCategory;
  item: string;
  description: string;
  imageUrl: string | null;
  bagId: string | null;
  notes: string;
  completed: boolean;
  priority: string;
  price: number | null;
  priceRangeMin: null;
  priceRangeMax: null;
  recommendedBrand: string | null;
  recommendedStore: string | null;
  purchaseLink: string | null;
  studentRating: null;
  importance: string;
  quantity: number;
  isCustomItem: boolean;
  defaultChecklistItemId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function hydrate(
  row: Record<string, any>,
  masterById: Map<string, DefaultChecklistItemDocument & { _id: unknown }>,
): HydratedChecklistRow {
  const master = row.defaultChecklistItemId ? masterById.get(String(row.defaultChecklistItemId)) : undefined;
  return {
    _id: String(row._id),
    category: (row.isCustomItem ? row.customCategory : master?.category) || "Miscellaneous",
    item: (row.isCustomItem ? row.customName : master?.title) || "",
    description: master?.description ?? "",
    imageUrl: master?.image ?? null,
    bagId: row.bagId ? String(row.bagId) : null,
    notes: row.note ?? "",
    completed: Boolean(row.checked),
    priority: master?.priority ?? "medium",
    price: master?.estimatedPrice ?? null,
    priceRangeMin: null,
    priceRangeMax: null,
    recommendedBrand: master?.recommendedBrand ?? null,
    recommendedStore: master?.recommendedStore ?? null,
    purchaseLink: master?.purchaseLink ?? null,
    studentRating: null,
    importance: master?.importance ?? "",
    quantity: row.quantity ?? 1,
    isCustomItem: Boolean(row.isCustomItem),
    defaultChecklistItemId: row.defaultChecklistItemId ? String(row.defaultChecklistItemId) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Flat list of a user's checklist rows, master metadata joined in. Excludes soft-deleted rows. */
export async function listItemsForUser(userId: string): Promise<HydratedChecklistRow[]> {
  await connectDB();

  const rows = await UserChecklist.find({ userId, deleted: false }).sort({ createdAt: -1 }).lean();
  const masterIds = rows.map((r) => r.defaultChecklistItemId).filter(Boolean);
  const masters = masterIds.length > 0 ? await DefaultChecklistItem.find({ _id: { $in: masterIds } }).lean() : [];
  const masterById = new Map(masters.map((m) => [String(m._id), m]));

  return rows.map((row) => hydrate(row, masterById));
}

export async function getDistinctCategoriesForUser(userId: string) {
  const items = await listItemsForUser(userId);
  return Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
}

export async function getOverallProgress(userId: string) {
  await connectDB();
  const [total, completed] = await Promise.all([
    UserChecklist.countDocuments({ userId, deleted: false }),
    UserChecklist.countDocuments({ userId, deleted: false, checked: true }),
  ]);
  return { total, completed };
}

export async function createCustomItem(
  userId: string,
  input: { category: string; item: string; notes?: string; bagId?: string | null },
) {
  await connectDB();
  const customName = input.item.trim();
  const doc = await UserChecklist.create({
    userId,
    defaultChecklistItemId: null,
    isCustomItem: true,
    customCategory: input.category.trim(),
    customName,
    customNameNormalized: normalizeItemName(customName),
    note: input.notes ?? "",
    bagId: input.bagId ?? null,
    checked: false,
    quantity: 1,
  });
  return hydrate(doc.toObject(), new Map());
}

/** Mirrors the legacy bulk-create-in-one-category flow, but only for custom items (no master
 * catalog match) — used by the "add several items at once" quick-add UI. */
export async function createCustomItems(userId: string, category: string, names: string[]) {
  await connectDB();

  const existing = await UserChecklist.find({ userId, deleted: false, isCustomItem: true, customCategory: category })
    .select("customName")
    .lean();
  const existingNames = existing.map((i) => i.customName ?? "");

  const seen: string[] = [];
  const docs: {
    userId: string;
    isCustomItem: true;
    customCategory: string;
    customName: string;
    customNameNormalized: string;
  }[] = [];

  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;
    const isDuplicate = [...existingNames, ...seen].some((other) => areNearDuplicateNames(name, other));
    if (isDuplicate) continue;
    seen.push(name);
    docs.push({ userId, isCustomItem: true, customCategory: category, customName: name, customNameNormalized: normalizeItemName(name) });
  }

  if (docs.length === 0) {
    return { count: 0, skipped: names.length };
  }

  await UserChecklist.insertMany(docs);
  return { count: docs.length, skipped: names.length - docs.length };
}

/** Master-linked rows only accept the per-user overlay fields (checked/quantity/note/bagId);
 * custom rows additionally accept customName/customCategory. Any other field silently has no
 * effect — the rich metadata for master-linked items lives on DefaultChecklistItem and is
 * admin-managed only. */
export async function updateItem(
  userId: string,
  id: string,
  input: {
    completed?: boolean;
    quantity?: number;
    notes?: string;
    bagId?: string | null;
    item?: string;
    category?: string;
  },
) {
  await connectDB();

  const row = await UserChecklist.findOne({ _id: id, userId, deleted: false }).lean();
  if (!row) return null;

  const patch: Record<string, unknown> = {};
  if (input.completed !== undefined) patch.checked = input.completed;
  if (input.quantity !== undefined) patch.quantity = Math.max(1, input.quantity);
  if (input.notes !== undefined) patch.note = input.notes;
  if (input.bagId !== undefined) patch.bagId = input.bagId;
  if (row.isCustomItem) {
    if (input.item !== undefined) {
      const customName = input.item.trim();
      patch.customName = customName;
      patch.customNameNormalized = normalizeItemName(customName);
    }
    if (input.category !== undefined) patch.customCategory = input.category.trim();
  }

  const updated = await UserChecklist.findOneAndUpdate({ _id: id, userId }, patch, {
    returnDocument: "after",
  }).lean();
  if (!updated) return null;

  const masters = updated.defaultChecklistItemId
    ? await DefaultChecklistItem.find({ _id: updated.defaultChecklistItemId }).lean()
    : [];
  return hydrate(updated, new Map(masters.map((m) => [String(m._id), m])));
}

export async function renameItem(userId: string, id: string, item: string) {
  return updateItem(userId, id, { item });
}

/** Custom rows are hard-deleted (they only ever belonged to this user). Master-linked rows are
 * soft-deleted so admin analytics can still count them as "skipped" against the master item. */
export async function deleteItem(userId: string, id: string) {
  await connectDB();
  const row = await UserChecklist.findOne({ _id: id, userId }).lean();
  if (!row) return;

  if (row.isCustomItem) {
    await UserChecklist.deleteOne({ _id: id, userId });
  } else {
    await UserChecklist.updateOne({ _id: id, userId }, { deleted: true });
  }
}

export async function bulkUpdateItems(
  userId: string,
  ids: string[],
  action: "complete" | "incomplete" | "delete" | "duplicate",
) {
  await connectDB();

  if (action === "delete") {
    const rows = await UserChecklist.find({ _id: { $in: ids }, userId }).select("isCustomItem").lean();
    const customIds = rows.filter((r) => r.isCustomItem).map((r) => r._id);
    const masterIds = rows.filter((r) => !r.isCustomItem).map((r) => r._id);
    await Promise.all([
      customIds.length > 0 ? UserChecklist.deleteMany({ _id: { $in: customIds }, userId }) : null,
      masterIds.length > 0 ? UserChecklist.updateMany({ _id: { $in: masterIds }, userId }, { deleted: true }) : null,
    ]);
    return;
  }

  if (action === "complete" || action === "incomplete") {
    await UserChecklist.updateMany({ _id: { $in: ids }, userId }, { checked: action === "complete" });
    return;
  }

  if (action === "duplicate") {
    // Only custom rows can be duplicated — a master-linked row is a unique reference to the
    // catalog item (userId, defaultChecklistItemId) and can't have two rows.
    const rows = await UserChecklist.find({ _id: { $in: ids }, userId, isCustomItem: true }).lean();
    const copies = rows.map((doc) => ({
      userId,
      isCustomItem: true,
      customCategory: doc.customCategory,
      customName: doc.customName,
      customNameNormalized: doc.customNameNormalized ?? normalizeItemName(doc.customName ?? ""),
      note: doc.note,
      bagId: doc.bagId,
      quantity: doc.quantity,
      checked: false,
    }));
    if (copies.length > 0) {
      await UserChecklist.insertMany(copies);
    }
  }
}
