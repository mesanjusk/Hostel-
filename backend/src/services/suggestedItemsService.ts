import { connectDB } from "@/db";
import { UserChecklist } from "@/models/UserChecklist";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { User } from "@/models/User";
import { CollegeCategory } from "@/models/CollegeCategory";
import { Course } from "@/models/Course";
import { normalizeItemName } from "@/lib/textSimilarity";
import { mostFrequent } from "@/lib/stats";
import { createDefaultChecklistItem, type DefaultChecklistItemInput } from "@/services/defaultChecklistItemService";
import type { ChecklistPriority } from "@/types";

export interface SuggestedItem {
  key: string;
  name: string;
  category: string;
  usersUsing: number;
  completionPercent: number;
  mostPopularCollegeCategory: string | null;
  mostPopularCourse: string | null;
  firstAdded: string;
  lastUsed: string;
}

/** User-created checklist items that aren't already in the master catalog (case-insensitive
 * title match), grouped and ranked by how many students independently added the same thing —
 * the admin's queue of "items worth promoting to the default checklist". */
export async function listSuggestedItems(): Promise<SuggestedItem[]> {
  await connectDB();

  const [customRows, masterItems] = await Promise.all([
    UserChecklist.find({ isCustomItem: true, deleted: false }).lean(),
    DefaultChecklistItem.find().select("title").lean(),
  ]);

  const masterNames = new Set(masterItems.map((m) => normalizeItemName(m.title)));
  const candidates = customRows.filter(
    (r) => r.customName && !masterNames.has(normalizeItemName(r.customName)),
  );
  if (candidates.length === 0) return [];

  const userIds = Array.from(new Set(candidates.map((c) => String(c.userId))));
  const [users, categories, courses] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("collegeCategoryId courseId").lean(),
    CollegeCategory.find().select("name").lean(),
    Course.find().select("name").lean(),
  ]);
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const categoryNameById = new Map(categories.map((c) => [String(c._id), c.name]));
  const courseNameById = new Map(courses.map((c) => [String(c._id), c.name]));

  const groups = new Map<string, typeof candidates>();
  for (const row of candidates) {
    const key = normalizeItemName(row.customName ?? "");
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .map(([key, rows]) => {
      const distinctUserIds = Array.from(new Set(rows.map((r) => String(r.userId))));
      const checkedCount = rows.filter((r) => r.checked).length;
      const collegeCategoryIds = distinctUserIds
        .map((id) => userById.get(id)?.collegeCategoryId)
        .filter(Boolean)
        .map(String);
      const courseIds = distinctUserIds.map((id) => userById.get(id)?.courseId).filter(Boolean).map(String);
      const popularCategoryId = mostFrequent(collegeCategoryIds);
      const popularCourseId = mostFrequent(courseIds);

      const createdTimes = rows.map((r) => new Date(r.createdAt as unknown as string).getTime());
      const updatedTimes = rows.map((r) => new Date(r.updatedAt as unknown as string).getTime());

      return {
        key,
        name: mostFrequent(rows.map((r) => r.customName ?? "")) ?? key,
        category: mostFrequent(rows.map((r) => r.customCategory).filter((c): c is string => Boolean(c))) ?? "Miscellaneous",
        usersUsing: distinctUserIds.length,
        completionPercent: rows.length === 0 ? 0 : Math.round((checkedCount / rows.length) * 100),
        mostPopularCollegeCategory: popularCategoryId ? (categoryNameById.get(popularCategoryId) ?? null) : null,
        mostPopularCourse: popularCourseId ? (courseNameById.get(popularCourseId) ?? null) : null,
        firstAdded: new Date(Math.min(...createdTimes)).toISOString(),
        lastUsed: new Date(Math.max(...updatedTimes)).toISOString(),
      };
    })
    .sort((a, b) => b.usersUsing - a.usersUsing);
}

export async function addSuggestedItemToDefault(
  input: {
    name: string;
    category: string;
    description?: string;
    priority?: ChecklistPriority;
    applicableCollegeCategories?: string[];
    applicableCourses?: string[];
    isForAllCollegeCategories?: boolean;
    isForAllCourses?: boolean;
  },
  adminUserId: string,
) {
  const payload: DefaultChecklistItemInput = {
    category: input.category,
    title: input.name,
    description: input.description ?? "",
    priority: input.priority ?? "medium",
    applicableCollegeCategories: input.applicableCollegeCategories ?? [],
    applicableCourses: input.applicableCourses ?? [],
    isForAllCollegeCategories: input.isForAllCollegeCategories ?? true,
    isForAllCourses: input.isForAllCourses ?? true,
  };
  return createDefaultChecklistItem(payload, adminUserId);
}
