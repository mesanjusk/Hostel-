import { Types } from "mongoose";

import { connectDB } from "@/db";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { UserChecklist } from "@/models/UserChecklist";
import { getOrCreateActiveTemplate } from "@/services/checklistTemplateService";
import { normalizeItemName } from "@/lib/textSimilarity";
import { escapeRegex } from "@/lib/regex";
import type { ChecklistGender, ChecklistPriority, StoreOption } from "@/types";

/** Deleting a DefaultChecklistItem that existing students already reference would otherwise
 * leave their UserChecklist row pointing at nothing — silently rendering as a blank/"Untitled"
 * entry with no way to fix it. Instead, detach those rows into frozen custom items (preserving
 * checked state, quantity, note, bag) so the student keeps exactly what they had, just no
 * longer linked to admin-managed master data. */
async function detachUserChecklistRowsFromItems(itemIds: string[]) {
  await connectDB();
  if (itemIds.length === 0) return 0;

  const masters = await DefaultChecklistItem.find({ _id: { $in: itemIds } }).select("title category").lean();
  if (masters.length === 0) return 0;
  const masterById = new Map(masters.map((m) => [String(m._id), m]));

  const rows = await UserChecklist.find({ defaultChecklistItemId: { $in: itemIds }, deleted: false })
    .select("defaultChecklistItemId")
    .lean();
  if (rows.length === 0) return 0;

  const ops = rows.map((row) => {
    const master = masterById.get(String(row.defaultChecklistItemId));
    const customName = master?.title ?? "Removed item";
    const customCategory = master?.category ?? "Miscellaneous";
    return {
      updateOne: {
        filter: { _id: row._id },
        update: {
          $set: {
            defaultChecklistItemId: null,
            isCustomItem: true,
            customName,
            customCategory,
            customNameNormalized: normalizeItemName(customName),
          },
        },
      },
    };
  });

  const result = await UserChecklist.bulkWrite(ops, { ordered: false });
  return result.modifiedCount ?? 0;
}

export interface DefaultChecklistItemInput {
  category: string;
  title: string;
  description?: string;
  image?: string | null;
  priority?: ChecklistPriority;
  importance?: string;
  estimatedPrice?: number | null;
  recommendedBrand?: string | null;
  recommendedStore?: StoreOption | null;
  purchaseLink?: string | null;
  sortOrder?: number;
  gender?: ChecklistGender;
  applicableCollegeCategories?: string[];
  applicableCourses?: string[];
  isForAllCollegeCategories?: boolean;
  isForAllCourses?: boolean;
  active?: boolean;
}

/** Items applicable to a given (collegeCategoryId, courseId, gender) combination — the core
 * targeting rule used both by checklist generation and by the admin item list's "applies to"
 * filter. "All categories" OR "matches selected category", AND "all courses" OR "matches
 * selected course" (courses are only meaningful once a category matches), AND unisex ("All")
 * OR matches the student's gender. A student with no gender on file only sees unisex items. */
export async function findApplicableItems(
  templateId: string,
  collegeCategoryId: string | null,
  courseId: string | null,
  gender?: ChecklistGender | null,
) {
  await connectDB();

  const categoryClause = collegeCategoryId
    ? { $or: [{ isForAllCollegeCategories: true }, { applicableCollegeCategories: collegeCategoryId }] }
    : { isForAllCollegeCategories: true };

  const courseClause = courseId
    ? { $or: [{ isForAllCourses: true }, { applicableCourses: courseId }] }
    : { isForAllCourses: true };

  const genderClause: Record<string, unknown> = gender
    ? { $or: [{ gender: "All" }, { gender }] }
    : { gender: "All" };

  return DefaultChecklistItem.find({
    templateId,
    active: true,
    $and: [categoryClause, courseClause, genderClause],
  })
    .sort({ category: 1, sortOrder: 1, title: 1 })
    .lean();
}

export interface AdminListFilters {
  search?: string;
  category?: string;
  collegeCategoryId?: string;
  courseId?: string;
  gender?: ChecklistGender;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listDefaultChecklistItemsForAdmin(filters: AdminListFilters) {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { category: { $regex: filters.search, $options: "i" } },
    ];
  }
  if (filters.category) query.category = filters.category;
  if (filters.gender) query.gender = filters.gender;
  if (filters.collegeCategoryId) {
    query.$and = [
      { $or: [{ isForAllCollegeCategories: true }, { applicableCollegeCategories: filters.collegeCategoryId }] },
    ];
  }
  if (filters.courseId) {
    query.$and = [
      ...((query.$and as unknown[]) ?? []),
      { $or: [{ isForAllCourses: true }, { applicableCourses: filters.courseId }] },
    ];
  }
  if (filters.active !== undefined) query.active = filters.active;

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 25));

  const [items, total] = await Promise.all([
    DefaultChecklistItem.find(query)
      .sort({ category: 1, sortOrder: 1, title: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    DefaultChecklistItem.countDocuments(query),
  ]);

  return { items, total, page, pageSize };
}

export async function getDefaultChecklistItem(id: string) {
  await connectDB();
  return DefaultChecklistItem.findById(id).lean();
}

export async function createDefaultChecklistItem(input: DefaultChecklistItemInput, adminUserId: string) {
  await connectDB();

  const template = await getOrCreateActiveTemplate();

  const duplicate = await DefaultChecklistItem.findOne({
    templateId: template._id,
    category: input.category.trim(),
    title: { $regex: `^${escapeRegex(input.title.trim())}$`, $options: "i" },
  }).lean();
  if (duplicate) {
    return { success: false as const, error: "An item with this title already exists in this category" };
  }

  const item = await DefaultChecklistItem.create({
    templateId: template._id,
    category: input.category.trim(),
    title: input.title.trim(),
    description: input.description ?? "",
    image: input.image ?? null,
    priority: input.priority ?? "medium",
    importance: input.importance ?? "",
    estimatedPrice: input.estimatedPrice ?? null,
    recommendedBrand: input.recommendedBrand ?? null,
    recommendedStore: input.recommendedStore ?? null,
    purchaseLink: input.purchaseLink ?? null,
    sortOrder: input.sortOrder ?? 0,
    gender: input.gender ?? "All",
    applicableCollegeCategories: input.applicableCollegeCategories ?? [],
    applicableCourses: input.applicableCourses ?? [],
    isForAllCollegeCategories: input.isForAllCollegeCategories ?? true,
    isForAllCourses: input.isForAllCourses ?? true,
    active: input.active ?? true,
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });

  return { success: true as const, item };
}

export async function updateDefaultChecklistItem(
  id: string,
  input: Partial<DefaultChecklistItemInput>,
  adminUserId: string,
) {
  await connectDB();

  const patch: Record<string, unknown> = { ...input, updatedBy: adminUserId };
  if (input.category !== undefined) patch.category = input.category.trim();
  if (input.title !== undefined) patch.title = input.title.trim();

  const item = await DefaultChecklistItem.findByIdAndUpdate(id, patch, { returnDocument: "after" }).lean();
  if (!item) {
    return { success: false as const, error: "Item not found" };
  }

  return { success: true as const, item };
}

export async function deleteDefaultChecklistItem(id: string) {
  await connectDB();
  const detachedCount = await detachUserChecklistRowsFromItems([id]);
  await DefaultChecklistItem.deleteOne({ _id: id });
  return { success: true as const, detachedCount };
}

export async function bulkDeleteDefaultChecklistItems(ids: string[]) {
  await connectDB();
  const detachedCount = await detachUserChecklistRowsFromItems(ids);
  const result = await DefaultChecklistItem.deleteMany({ _id: { $in: ids } });
  return { deletedCount: result.deletedCount ?? 0, detachedCount };
}

export async function bulkSetActive(ids: string[], active: boolean) {
  await connectDB();
  const result = await DefaultChecklistItem.updateMany({ _id: { $in: ids } }, { active });
  return { modifiedCount: result.modifiedCount ?? 0 };
}

export interface BulkImportRow {
  category: string;
  title: string;
  description?: string;
  priority?: ChecklistPriority;
  estimatedPrice?: number;
  gender?: ChecklistGender;
  isForAllCollegeCategories?: boolean;
  collegeCategoryNames?: string[];
}

/** Bulk import by category+title (case-insensitive); rows that already exist in the template
 * are skipped rather than duplicated. `collegeCategoryNames` are resolved to ids by the caller
 * (route layer) before this is invoked, since name resolution needs a DB round trip per name. */
export async function bulkImportDefaultChecklistItems(
  rows: (BulkImportRow & { applicableCollegeCategories?: string[] })[],
  adminUserId: string,
) {
  await connectDB();

  const template = await getOrCreateActiveTemplate();
  const existing = await DefaultChecklistItem.find({ templateId: template._id })
    .select("category title")
    .lean();
  const existingKeys = new Set(
    existing.map((i) => `${i.category.trim().toLowerCase()}::${i.title.trim().toLowerCase()}`),
  );

  const seen = new Set<string>();
  const docs = [];
  let skipped = 0;

  for (const row of rows) {
    const key = `${row.category.trim().toLowerCase()}::${row.title.trim().toLowerCase()}`;
    if (existingKeys.has(key) || seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    docs.push({
      templateId: template._id,
      category: row.category.trim(),
      title: row.title.trim(),
      description: row.description ?? "",
      priority: row.priority ?? "medium",
      estimatedPrice: row.estimatedPrice ?? null,
      gender: row.gender ?? "All",
      applicableCollegeCategories: row.applicableCollegeCategories ?? [],
      isForAllCollegeCategories: row.isForAllCollegeCategories ?? true,
      isForAllCourses: true,
      active: true,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    });
  }

  if (docs.length > 0) {
    await DefaultChecklistItem.insertMany(docs);
  }

  return { imported: docs.length, skipped };
}

export async function listDistinctCategories(templateId?: string) {
  await connectDB();
  const template = templateId ? { _id: new Types.ObjectId(templateId) } : await getOrCreateActiveTemplate();
  const id = "_id" in template ? template._id : template;
  return DefaultChecklistItem.distinct("category", { templateId: id });
}
