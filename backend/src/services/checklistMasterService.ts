import { connectDB } from "@/db";
import { CollegeCategory } from "@/models/CollegeCategory";
import { Course } from "@/models/Course";
import { ChecklistTemplate } from "@/models/ChecklistTemplate";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { UserChecklist } from "@/models/UserChecklist";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/defaultChecklistTemplate";
import { ChecklistItem } from "@/models/ChecklistItem";

export const normalizeTitle = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
export const slugify = (value: string) => normalizeTitle(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const INITIAL_CATEGORIES = ["Design", "Engineering", "Medical", "Commerce", "Law", "Science", "Arts", "Architecture", "Animation", "Hotel Management", "Agriculture", "Management", "Other"];
const INITIAL_COURSES: Record<string, string[]> = {
  Design: ["Fashion Design", "Graphic Design", "Interior Design", "Textile Design"],
  Engineering: ["Computer Science", "Mechanical", "Civil", "Electrical"],
  Management: ["MBA"], Medical: ["MBBS", "BDS", "Nursing"], Law: ["LLB"], Other: ["Other"],
};

export async function ensureChecklistMasterData() {
  await connectDB();
  const categoryByName = new Map<string, any>();
  for (const [index, name] of INITIAL_CATEGORIES.entries()) {
    const doc = await CollegeCategory.findOneAndUpdate(
      { slug: slugify(name) },
      { $setOnInsert: { name, slug: slugify(name), sortOrder: index, active: true } },
      { upsert: true, new: true },
    ).lean();
    categoryByName.set(name, doc);
  }
  for (const [categoryName, courses] of Object.entries(INITIAL_COURSES)) {
    const category = categoryByName.get(categoryName);
    if (!category) continue;
    for (const [index, name] of courses.entries()) {
      await Course.findOneAndUpdate(
        { collegeCategoryId: category._id, slug: slugify(name) },
        { $setOnInsert: { collegeCategoryId: category._id, name, slug: slugify(name), sortOrder: index, active: true } },
        { upsert: true },
      );
    }
  }

  const template = await ChecklistTemplate.findOneAndUpdate(
    { name: "Default Template", version: 1 },
    { $setOnInsert: { name: "Default Template", version: 1, description: "Production default checklist", published: true, active: true } },
    { upsert: true, new: true },
  );
  const design = categoryByName.get("Design");
  const fashion = design ? await Course.findOne({ collegeCategoryId: design._id, slug: "fashion-design" }).lean() : null;
  for (const [index, item] of DEFAULT_CHECKLIST_TEMPLATE.entries()) {
    const designOnly = item.category === "Fashion Design Tools";
    await DefaultChecklistItem.updateOne(
      { templateId: template._id, normalizedTitle: normalizeTitle(item.item) },
      {
        $setOnInsert: {
          templateId: template._id,
          category: item.category,
          title: item.item,
          normalizedTitle: normalizeTitle(item.item),
          description: item.description ?? "",
          priority: item.priority,
          sortOrder: index,
          isForAllCollegeCategories: !designOnly,
          isForAllCourses: !designOnly,
          applicableCollegeCategories: designOnly && design ? [design._id] : [],
          applicableCourses: designOnly && fashion ? [fashion._id] : [],
          active: true,
        },
      },
      { upsert: true },
    );
  }
  return template;
}

export async function listEducationOptions() {
  await ensureChecklistMasterData();
  const [categories, courses] = await Promise.all([
    CollegeCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    Course.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean(),
  ]);
  return { categories, courses };
}

export async function listAdminChecklistItems({ search = "", page = 1, pageSize = 25 } = {}) {
  await ensureChecklistMasterData();
  const filter: any = search ? { $text: { $search: search } } : {};
  const [items, total] = await Promise.all([
    DefaultChecklistItem.find(filter).sort({ sortOrder: 1, category: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    DefaultChecklistItem.countDocuments(filter),
  ]);
  const analytics = await UserChecklist.aggregate([
    { $match: { defaultChecklistItemId: { $ne: null } } },
    { $group: { _id: "$defaultChecklistItemId", usersUsing: { $sum: 1 }, completed: { $sum: { $cond: ["$checked", 1, 0] } }, skipped: { $sum: { $cond: ["$deleted", 1, 0] } } } },
  ]);
  const byId = new Map(analytics.map((a) => [String(a._id), a]));
  return { items: items.map((item) => ({ ...item, analytics: byId.get(String(item._id)) ?? { usersUsing: 0, completed: 0, skipped: 0 } })), total, page, pageSize };
}

export async function createDefaultChecklistItem(input: any, userId?: string) {
  await ensureChecklistMasterData();
  const template = await ChecklistTemplate.findOne({ active: true, published: true }).sort({ version: -1 });
  if (!template) throw new Error("No active checklist template");
  const normalizedTitle = normalizeTitle(input.title);
  const existing = await DefaultChecklistItem.findOne({ templateId: template._id, normalizedTitle }).lean();
  if (existing) return { success: false as const, error: "Default checklist item already exists" };
  const doc = await DefaultChecklistItem.create({ ...input, templateId: template._id, normalizedTitle, createdBy: userId ?? null, updatedBy: userId ?? null });
  return { success: true as const, item: doc };
}

export async function updateDefaultChecklistItem(id: string, input: any, userId?: string) {
  await connectDB();
  const normalizedTitle = input.title ? normalizeTitle(input.title) : undefined;
  return DefaultChecklistItem.findByIdAndUpdate(id, { ...input, ...(normalizedTitle ? { normalizedTitle } : {}), updatedBy: userId ?? null }, { returnDocument: "after" }).lean();
}

export async function deleteDefaultChecklistItem(id: string) { await connectDB(); return DefaultChecklistItem.findByIdAndUpdate(id, { active: false }, { returnDocument: "after" }).lean(); }

export async function getSuggestedItems() {
  await ensureChecklistMasterData();
  const defaults = new Set((await DefaultChecklistItem.find().select("normalizedTitle").lean()).map((i) => i.normalizedTitle));
  const rows = await ChecklistItem.aggregate([
    { $group: { _id: { name: { $toLower: "$item" }, category: "$category" }, usersUsing: { $addToSet: "$userId" }, completed: { $sum: { $cond: ["$completed", 1, 0] } }, firstAdded: { $min: "$createdAt" }, lastUsed: { $max: "$updatedAt" } } },
    { $project: { item: "$_id.name", category: "$_id.category", usersUsing: { $size: "$usersUsing" }, completed: 1, firstAdded: 1, lastUsed: 1 } },
    { $sort: { usersUsing: -1, lastUsed: -1 } },
    { $limit: 100 },
  ]);
  return rows.filter((r) => !defaults.has(normalizeTitle(r.item))).map((r) => ({ ...r, completionRate: r.usersUsing ? Math.round((r.completed / r.usersUsing) * 100) : 0 }));
}

export async function getChecklistAdminDashboard() {
  await ensureChecklistMasterData();
  const [totalCategories, totalCourses, totalDefaultItems, suggestedItems, completed, totalUserChecklist, recentlyAdded, recentlyUpdated] = await Promise.all([
    CollegeCategory.countDocuments({ active: true }), Course.countDocuments({ active: true }), DefaultChecklistItem.countDocuments({ active: true }), getSuggestedItems(), UserChecklist.countDocuments({ checked: true, deleted: false }), UserChecklist.countDocuments({ deleted: false }), DefaultChecklistItem.find().sort({ createdAt: -1 }).limit(5).lean(), DefaultChecklistItem.find().sort({ updatedAt: -1 }).limit(5).lean(),
  ]);
  return { totalCategories, totalCourses, totalDefaultItems, suggestedItems: suggestedItems.length, completionRate: totalUserChecklist ? Math.round((completed / totalUserChecklist) * 100) : 0, recentlyAdded, recentlyUpdated };
}

export async function activeDefaultItemsForUser(user: any) {
  await ensureChecklistMasterData();
  const template = await ChecklistTemplate.findOne({ active: true, published: true }).sort({ version: -1 }).lean();
  if (!template) return [];
  const categoryId = user.collegeCategoryId ?? null;
  const courseId = user.courseId ?? null;
  return DefaultChecklistItem.find({ templateId: template._id, active: true, $and: [{ $or: [{ isForAllCollegeCategories: true }, { applicableCollegeCategories: categoryId }] }, { $or: [{ isForAllCourses: true }, { applicableCourses: courseId }] }] }).sort({ sortOrder: 1 }).lean();
}
