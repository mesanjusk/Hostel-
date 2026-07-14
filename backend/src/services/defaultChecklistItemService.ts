import { Types } from "mongoose";

import { connectDB } from "@/db";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { getOrCreateActiveTemplate } from "@/services/checklistTemplateService";
import type { ChecklistPriority, StoreOption } from "@/types";

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
  applicableCollegeCategories?: string[];
  applicableCourses?: string[];
  isForAllCollegeCategories?: boolean;
  isForAllCourses?: boolean;
  active?: boolean;
}

/** Items applicable to a given (collegeCategoryId, courseId) pair — the core targeting rule
 * used both by checklist generation and by the admin item list's "applies to" filter.
 * "All categories" OR "matches selected category", AND "all courses" OR "matches selected
 * course" (courses are only meaningful once a category matches). */
export async function findApplicableItems(
  templateId: string,
  collegeCategoryId: string | null,
  courseId: string | null,
) {
  await connectDB();

  const categoryClause = collegeCategoryId
    ? { $or: [{ isForAllCollegeCategories: true }, { applicableCollegeCategories: collegeCategoryId }] }
    : { isForAllCollegeCategories: true };

  const courseClause = courseId
    ? { $or: [{ isForAllCourses: true }, { applicableCourses: courseId }] }
    : { isForAllCourses: true };

  return DefaultChecklistItem.find({
    templateId,
    active: true,
    $and: [categoryClause, courseClause],
  })
    .sort({ category: 1, sortOrder: 1, title: 1 })
    .lean();
}

export interface AdminListFilters {
  search?: string;
  category?: string;
  collegeCategoryId?: string;
  courseId?: string;
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
    title: { $regex: `^${escapeRegExp(input.title.trim())}$`, $options: "i" },
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
  await DefaultChecklistItem.deleteOne({ _id: id });
  return { success: true as const };
}

export async function bulkDeleteDefaultChecklistItems(ids: string[]) {
  await connectDB();
  const result = await DefaultChecklistItem.deleteMany({ _id: { $in: ids } });
  return { deletedCount: result.deletedCount ?? 0 };
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
