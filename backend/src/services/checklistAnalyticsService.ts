import { connectDB } from "@/db";
import { UserChecklist } from "@/models/UserChecklist";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { CollegeCategory } from "@/models/CollegeCategory";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { mostFrequent } from "@/lib/stats";

/** Per-item usage analytics shown on the Default Checklist admin page: how many students
 * actually have this item, how many finished it, how many removed it ("skipped" — a
 * soft-deleted UserChecklist row), and which cohort uses it most. */
export async function getDefaultItemAnalytics(itemIds: string[]) {
  await connectDB();
  if (itemIds.length === 0) return new Map();

  const rows = await UserChecklist.find({ defaultChecklistItemId: { $in: itemIds } })
    .select("defaultChecklistItemId userId checked deleted")
    .lean();

  const userIds = Array.from(new Set(rows.map((r) => String(r.userId))));
  const users = await User.find({ _id: { $in: userIds } }).select("collegeCategoryId courseId").lean();
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const [categories, courses] = await Promise.all([
    CollegeCategory.find().select("name").lean(),
    Course.find().select("name").lean(),
  ]);
  const categoryNameById = new Map(categories.map((c) => [String(c._id), c.name]));
  const courseNameById = new Map(courses.map((c) => [String(c._id), c.name]));

  const byItem = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = String(row.defaultChecklistItemId);
    const group = byItem.get(key) ?? [];
    group.push(row);
    byItem.set(key, group);
  }

  const result = new Map<
    string,
    {
      usersUsing: number;
      completed: number;
      skipped: number;
      completionRate: number;
      popularityScore: number;
      mostPopularCollegeCategory: string | null;
      mostPopularCourse: string | null;
    }
  >();

  for (const id of itemIds) {
    const group = byItem.get(id) ?? [];
    const active = group.filter((r) => !r.deleted);
    const completed = active.filter((r) => r.checked).length;
    const skipped = group.filter((r) => r.deleted).length;
    const collegeCategoryIds = active.map((r) => userById.get(String(r.userId))?.collegeCategoryId).filter(Boolean).map(String);
    const courseIds = active.map((r) => userById.get(String(r.userId))?.courseId).filter(Boolean).map(String);
    const popularCategoryId = mostFrequent(collegeCategoryIds);
    const popularCourseId = mostFrequent(courseIds);

    result.set(id, {
      usersUsing: active.length,
      completed,
      skipped,
      completionRate: active.length === 0 ? 0 : Math.round((completed / active.length) * 100),
      popularityScore: group.length,
      mostPopularCollegeCategory: popularCategoryId ? (categoryNameById.get(popularCategoryId) ?? null) : null,
      mostPopularCourse: popularCourseId ? (courseNameById.get(popularCourseId) ?? null) : null,
    });
  }

  return result;
}

export async function getChecklistDashboardStats() {
  await connectDB();

  const [
    totalCategories,
    totalCourses,
    totalDefaultItems,
    activeDefaultItems,
    totalRows,
    checkedRows,
    recentlyAdded,
    recentlyUpdated,
  ] = await Promise.all([
    CollegeCategory.countDocuments(),
    Course.countDocuments(),
    DefaultChecklistItem.countDocuments(),
    DefaultChecklistItem.countDocuments({ active: true }),
    UserChecklist.countDocuments({ deleted: false, defaultChecklistItemId: { $ne: null } }),
    UserChecklist.countDocuments({ deleted: false, defaultChecklistItemId: { $ne: null }, checked: true }),
    DefaultChecklistItem.find().sort({ createdAt: -1 }).limit(5).select("title category createdAt").lean(),
    DefaultChecklistItem.find().sort({ updatedAt: -1 }).limit(5).select("title category updatedAt").lean(),
  ]);

  return {
    totalCategories,
    totalCourses,
    totalDefaultItems,
    activeDefaultItems,
    completionRate: totalRows === 0 ? 0 : Math.round((checkedRows / totalRows) * 100),
    recentlyAdded,
    recentlyUpdated,
  };
}
