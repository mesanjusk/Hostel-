import { Types } from "mongoose";

import { connectDB } from "@/db";
import { UserChecklist } from "@/models/UserChecklist";
import { DefaultChecklistItem, type DefaultChecklistItemDocument } from "@/models/DefaultChecklistItem";
import { User } from "@/models/User";
import { ChecklistItem } from "@/models/ChecklistItem";
import { getOrCreateActiveTemplate } from "@/services/checklistTemplateService";
import { findApplicableItems } from "@/services/defaultChecklistItemService";
import { areNearDuplicateNames, normalizeItemName } from "@/lib/textSimilarity";
import type { ChecklistCategory } from "@/types";

/** A student is on the legacy (pre-DB-driven-catalog) architecture if they have real
 * ChecklistItem rows — those were only ever written by the old onboarding flow. Everyone else
 * (including a brand-new signup with zero UserChecklist rows, since nothing gets materialized
 * until they actually touch an item) is on the new live-catalog architecture below. */
export async function isLegacyChecklistUser(userId: string) {
  await connectDB();
  const count = await ChecklistItem.countDocuments({ userId });
  return count > 0;
}

const VIRTUAL_ID_PREFIX = "default:";

function toVirtualId(defaultChecklistItemId: string) {
  return `${VIRTUAL_ID_PREFIX}${defaultChecklistItemId}`;
}

function isVirtualId(id: string) {
  return id.startsWith(VIRTUAL_ID_PREFIX);
}

function parseVirtualId(id: string) {
  return id.slice(VIRTUAL_ID_PREFIX.length);
}

/** Fields to apply via `$setOnInsert` when an upsert materializes a virtual item into a real
 * row for the first time. Explicit rather than relying on the schema's own defaults — insertMany
 * silently failing to apply `DefaultChecklistItem.gender`'s default earlier this session is
 * exactly the failure mode this avoids. Excludes any key already present in `overrides`, since
 * MongoDB rejects an update where the same field appears in both `$set` and `$setOnInsert`. */
function materializeDefaults(
  userId: string | Types.ObjectId,
  defaultChecklistItemId: string | Types.ObjectId,
  overrides: Record<string, unknown>,
) {
  const defaults: Record<string, unknown> = {
    userId,
    defaultChecklistItemId,
    isCustomItem: false,
    checked: false,
    quantity: 1,
    note: "",
    bagId: null,
    planType: null,
    deleted: false,
  };
  for (const key of Object.keys(overrides)) delete defaults[key];
  return defaults;
}

/** The applicable catalog for a user (their college category / course / gender), plus every
 * UserChecklist row they have — including soft-deleted ones, since a deleted master-linked row
 * is a tombstone recording "I removed this suggestion" and must keep it from reappearing as a
 * virtual item. Shared by every read path below so they all agree on the same live merge. */
async function loadChecklistContext(userId: string) {
  await connectDB();

  // These three are mutually independent, so issue them together instead of four sequential
  // Atlas round-trips — on a remote DB each hop is ~200ms, and only findApplicableItems needs
  // the user + template results, so it's the sole query that has to wait.
  const [user, template, allRows] = await Promise.all([
    User.findById(userId).select("collegeCategoryId courseId gender").lean(),
    getOrCreateActiveTemplate(),
    UserChecklist.find({ userId }).lean(),
  ]);
  const applicableItems = await findApplicableItems(
    String(template._id),
    user?.collegeCategoryId ? String(user.collegeCategoryId) : null,
    user?.courseId ? String(user.courseId) : null,
    user?.gender ?? null,
  );

  return { applicableItems, allRows };
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
  planType: string | null;
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
  /** True for a catalog suggestion the user hasn't touched yet (no real row exists). Consumers
   * that care about actual user activity (e.g. the dashboard's "recent activity" feed) should
   * filter these out — they're not something the user did, just something they could add. */
  isVirtual: boolean;
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
    planType: row.planType ?? master?.planType ?? null,
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
    isVirtual: false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** A catalog item the user hasn't touched yet — not a real row, so it gets a synthetic
 * `default:<id>` id. Any write against that id (check it, add a note, delete it) materializes a
 * real UserChecklist row on the fly — see updateItem/deleteItem/bulkUpdateItems below. */
function hydrateVirtual(master: DefaultChecklistItemDocument & { _id: unknown }): HydratedChecklistRow {
  return {
    _id: toVirtualId(String(master._id)),
    category: master.category || "Miscellaneous",
    item: master.title || "",
    description: master.description ?? "",
    imageUrl: master.image ?? null,
    bagId: null,
    notes: "",
    completed: false,
    priority: master.priority ?? "medium",
    planType: master.planType ?? null,
    price: master.estimatedPrice ?? null,
    priceRangeMin: null,
    priceRangeMax: null,
    recommendedBrand: master.recommendedBrand ?? null,
    recommendedStore: master.recommendedStore ?? null,
    purchaseLink: master.purchaseLink ?? null,
    studentRating: null,
    importance: master.importance ?? "",
    quantity: 1,
    isCustomItem: false,
    defaultChecklistItemId: String(master._id),
    isVirtual: true,
    createdAt: (master as unknown as { createdAt: Date }).createdAt,
    updatedAt: (master as unknown as { updatedAt: Date }).updatedAt,
  };
}

/** Live-merged checklist: the user's real rows (materialized master-linked items + custom
 * items), plus a virtual, not-yet-materialized entry for every applicable catalog item they
 * haven't touched. Master-linked entries (real or virtual) sort by the catalog's own
 * category/sortOrder/title so the list stays stable regardless of what's been checked; custom
 * items follow, most recently added first. */
export async function listItemsForUser(userId: string): Promise<HydratedChecklistRow[]> {
  await connectDB();

  const { applicableItems, allRows } = await loadChecklistContext(userId);

  const materializedDefaultIds = new Set(
    allRows.filter((r) => r.defaultChecklistItemId).map((r) => String(r.defaultChecklistItemId)),
  );
  const visibleRows = allRows.filter((r) => !r.deleted);
  const customRows = visibleRows.filter((r) => r.isCustomItem);
  const materializedMasterRows = visibleRows.filter((r) => !r.isCustomItem);

  const applicableById = new Map(applicableItems.map((i) => [String(i._id), i]));
  const extraMasterIds = materializedMasterRows
    .map((r) => r.defaultChecklistItemId)
    .filter((id) => id && !applicableById.has(String(id)));
  const extraMasters =
    extraMasterIds.length > 0 ? await DefaultChecklistItem.find({ _id: { $in: extraMasterIds } }).lean() : [];
  const masterById = new Map([...applicableItems, ...extraMasters].map((m) => [String(m._id), m]));

  const virtualMasters = applicableItems.filter((item) => !materializedDefaultIds.has(String(item._id)));

  type SortKey = [string, number, string];
  const masterLinked: { sortKey: SortKey; hydrated: HydratedChecklistRow }[] = [
    ...materializedMasterRows.map((row) => {
      const master = row.defaultChecklistItemId ? masterById.get(String(row.defaultChecklistItemId)) : undefined;
      return {
        sortKey: [master?.category ?? "", master?.sortOrder ?? 0, master?.title ?? ""] as SortKey,
        hydrated: hydrate(row, masterById),
      };
    }),
    ...virtualMasters.map((master) => ({
      sortKey: [master.category, master.sortOrder, master.title] as SortKey,
      hydrated: hydrateVirtual(master),
    })),
  ];
  masterLinked.sort(
    (a, b) =>
      a.sortKey[0].localeCompare(b.sortKey[0]) ||
      a.sortKey[1] - b.sortKey[1] ||
      a.sortKey[2].localeCompare(b.sortKey[2]),
  );

  const customHydrated = customRows
    .slice()
    .sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime())
    .map((row) => hydrate(row, masterById));

  return [...masterLinked.map((e) => e.hydrated), ...customHydrated];
}

export async function getDistinctCategoriesForUser(userId: string) {
  const items = await listItemsForUser(userId);
  return Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
}

/** total = every applicable catalog item the user hasn't explicitly dismissed, plus their
 * custom items. completed = however many of those are checked. A dismissed (soft-deleted)
 * master-linked row is excluded from total entirely — the user asked not to see it. */
export async function getOverallProgress(userId: string) {
  await connectDB();

  const { applicableItems, allRows } = await loadChecklistContext(userId);
  const rowByDefaultId = new Map(
    allRows.filter((r) => r.defaultChecklistItemId).map((r) => [String(r.defaultChecklistItemId), r]),
  );

  let total = 0;
  let completed = 0;
  for (const item of applicableItems) {
    const row = rowByDefaultId.get(String(item._id));
    if (row?.deleted) continue;
    total += 1;
    if (row?.checked) completed += 1;
  }

  const customRows = allRows.filter((r) => r.isCustomItem && !r.deleted);
  total += customRows.length;
  completed += customRows.filter((r) => r.checked).length;

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

/** Master-linked rows only accept the per-user overlay fields (checked/quantity/note/bagId/
 * planType); custom rows additionally accept customName/customCategory. Any other field
 * silently has no effect — the rich metadata for master-linked items lives on
 * DefaultChecklistItem and is admin-managed only. A virtual id (not yet a real row) is
 * materialized on first write via upsert, keyed on the same (userId, defaultChecklistItemId)
 * pair the unique index enforces. */
export async function updateItem(
  userId: string,
  id: string,
  input: {
    completed?: boolean;
    quantity?: number;
    notes?: string;
    bagId?: string | null;
    planType?: string | null;
    item?: string;
    category?: string;
  },
) {
  await connectDB();

  if (isVirtualId(id)) {
    const defaultChecklistItemId = parseVirtualId(id);
    const patch: Record<string, unknown> = {};
    if (input.completed !== undefined) patch.checked = input.completed;
    if (input.quantity !== undefined) patch.quantity = Math.max(1, input.quantity);
    if (input.notes !== undefined) patch.note = input.notes;
    if (input.bagId !== undefined) patch.bagId = input.bagId;
    if (input.planType !== undefined) patch.planType = input.planType;

    const updated = await UserChecklist.findOneAndUpdate(
      { userId, defaultChecklistItemId },
      { $setOnInsert: materializeDefaults(userId, defaultChecklistItemId, patch), $set: patch },
      { upsert: true, returnDocument: "after" },
    ).lean();
    if (!updated) return null;

    const masters = await DefaultChecklistItem.find({ _id: defaultChecklistItemId }).lean();
    return hydrate(updated, new Map(masters.map((m) => [String(m._id), m])));
  }

  const row = await UserChecklist.findOne({ _id: id, userId, deleted: false }).lean();
  if (!row) return null;

  const patch: Record<string, unknown> = {};
  if (input.completed !== undefined) patch.checked = input.completed;
  if (input.quantity !== undefined) patch.quantity = Math.max(1, input.quantity);
  if (input.notes !== undefined) patch.note = input.notes;
  if (input.bagId !== undefined) patch.bagId = input.bagId;
  if (input.planType !== undefined) patch.planType = input.planType;
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
 * soft-deleted so admin analytics can still count them as "skipped" against the master item — a
 * virtual (never-materialized) id gets a tombstone row inserted instead, so it stops appearing
 * as a suggestion on every future read. */
export async function deleteItem(userId: string, id: string) {
  await connectDB();

  if (isVirtualId(id)) {
    const defaultChecklistItemId = parseVirtualId(id);
    const overrides = { deleted: true };
    await UserChecklist.updateOne(
      { userId, defaultChecklistItemId },
      { $setOnInsert: materializeDefaults(userId, defaultChecklistItemId, overrides), $set: overrides },
      { upsert: true },
    );
    return;
  }

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

  const virtualObjectIds = ids.filter(isVirtualId).map((id) => new Types.ObjectId(parseVirtualId(id)));
  const realIds = ids.filter((id) => !isVirtualId(id));
  const userObjectId = new Types.ObjectId(userId);

  if (action === "delete") {
    if (virtualObjectIds.length > 0) {
      const overrides = { deleted: true };
      await UserChecklist.bulkWrite(
        virtualObjectIds.map((defaultChecklistItemId) => ({
          updateOne: {
            filter: { userId: userObjectId, defaultChecklistItemId },
            update: {
              $setOnInsert: materializeDefaults(userObjectId, defaultChecklistItemId, overrides),
              $set: overrides,
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }
    if (realIds.length > 0) {
      const rows = await UserChecklist.find({ _id: { $in: realIds }, userId }).select("isCustomItem").lean();
      const customIds = rows.filter((r) => r.isCustomItem).map((r) => r._id);
      const masterIds = rows.filter((r) => !r.isCustomItem).map((r) => r._id);
      await Promise.all([
        customIds.length > 0 ? UserChecklist.deleteMany({ _id: { $in: customIds }, userId }) : null,
        masterIds.length > 0 ? UserChecklist.updateMany({ _id: { $in: masterIds }, userId }, { deleted: true }) : null,
      ]);
    }
    return;
  }

  if (action === "complete" || action === "incomplete") {
    const checked = action === "complete";
    if (virtualObjectIds.length > 0) {
      const overrides = { checked };
      await UserChecklist.bulkWrite(
        virtualObjectIds.map((defaultChecklistItemId) => ({
          updateOne: {
            filter: { userId: userObjectId, defaultChecklistItemId },
            update: {
              $setOnInsert: materializeDefaults(userObjectId, defaultChecklistItemId, overrides),
              $set: overrides,
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }
    if (realIds.length > 0) {
      await UserChecklist.updateMany({ _id: { $in: realIds }, userId }, { checked });
    }
    return;
  }

  if (action === "duplicate") {
    // Only custom rows can be duplicated — a master-linked row is a unique reference to the
    // catalog item (userId, defaultChecklistItemId) and can't have two rows. Virtual ids are
    // never custom, so they're naturally excluded by this query without extra handling.
    const rows = await UserChecklist.find({ _id: { $in: realIds }, userId, isCustomItem: true }).lean();
    const copies = rows.map((doc) => ({
      userId,
      isCustomItem: true,
      customCategory: doc.customCategory,
      customName: doc.customName,
      customNameNormalized: doc.customNameNormalized ?? normalizeItemName(doc.customName ?? ""),
      note: doc.note,
      bagId: doc.bagId,
      planType: doc.planType,
      quantity: doc.quantity,
      checked: false,
    }));
    if (copies.length > 0) {
      await UserChecklist.insertMany(copies);
    }
  }
}
