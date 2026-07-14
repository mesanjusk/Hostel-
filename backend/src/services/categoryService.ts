import { connectDB } from "@/db";
import { Category } from "@/models/Category";
import { ChecklistItem } from "@/models/ChecklistItem";
import { User } from "@/models/User";
import { DEFAULT_CHECKLIST_CATEGORIES } from "@/types";
import { getDistinctCategoriesForUser, hasUserChecklist } from "@/services/userChecklistService";

function normalize(name: string) {
  return name.trim().toLowerCase();
}

// "Fashion Design Tools" is only relevant to Designing students — everyone else's
// default category list (and starter checklist, see checklistService) skips it.
const DESIGN_ONLY_CATEGORY = "Fashion Design Tools";

/**
 * Idempotent bootstrap: seeds the default category names the first time a user has none,
 * unioned with any category strings already present on their checklist items.
 */
export async function ensureDefaultCategories(userId: string) {
  await connectDB();

  const existingCount = await Category.countDocuments({ userId });
  if (existingCount > 0) return;

  // DB-driven users: their checklist folders come entirely from whatever categories the
  // generation algorithm actually assigned them (already scoped to their college
  // category/course) — no hardcoded category list involved.
  if (await hasUserChecklist(userId)) {
    const names = new Set<string>(await getDistinctCategoriesForUser(userId));
    const docs = Array.from(names)
      .filter((name) => name && name.trim())
      .map((name) => ({ userId, name: name.trim(), normalizedName: normalize(name) }));
    if (docs.length > 0) {
      await Category.insertMany(docs, { ordered: false }).catch(() => {});
    }
    return;
  }

  const user = await User.findById(userId).select("collegeCategory").lean();
  const defaultCategories =
    user?.collegeCategory === "Designing"
      ? DEFAULT_CHECKLIST_CATEGORIES
      : DEFAULT_CHECKLIST_CATEGORIES.filter((c) => c !== DESIGN_ONLY_CATEGORY);

  const distinctItemCategories = await ChecklistItem.distinct("category", { userId });
  const names = new Set<string>([...defaultCategories, ...distinctItemCategories]);

  const docs = Array.from(names)
    .filter((name) => name && name.trim())
    .map((name) => ({ userId, name: name.trim(), normalizedName: normalize(name) }));

  if (docs.length > 0) {
    await Category.insertMany(docs, { ordered: false }).catch(() => {});
  }
}

export async function listCategories(userId: string) {
  await connectDB();
  await ensureDefaultCategories(userId);
  return Category.find({ userId }).sort({ createdAt: 1 }).lean();
}

export async function createCategory(userId: string, name: string, icon?: string | null) {
  await connectDB();

  const trimmed = name.trim();
  const existing = await Category.findOne({ userId, normalizedName: normalize(trimmed) }).lean();
  if (existing) {
    return { success: false as const, error: "A category with this name already exists" };
  }

  const doc = await Category.create({
    userId,
    name: trimmed,
    normalizedName: normalize(trimmed),
    icon: icon ?? null,
  });
  return { success: true as const, category: doc };
}

export async function renameCategory(
  userId: string,
  id: string,
  name: string,
  icon?: string | null,
) {
  await connectDB();

  const trimmed = name.trim();
  const current = await Category.findOne({ _id: id, userId }).lean();
  if (!current) {
    return { success: false as const, error: "Category not found" };
  }

  const clash = await Category.findOne({
    userId,
    normalizedName: normalize(trimmed),
    _id: { $ne: id },
  }).lean();
  if (clash) {
    return { success: false as const, error: "A category with this name already exists" };
  }

  await Category.updateOne(
    { _id: id, userId },
    { name: trimmed, normalizedName: normalize(trimmed), ...(icon !== undefined ? { icon } : {}) },
  );

  if (current.name !== trimmed) {
    await ChecklistItem.updateMany({ userId, category: current.name }, { category: trimmed });
  }

  return { success: true as const };
}

export async function deleteCategory(userId: string, id: string, moveItemsTo?: string) {
  await connectDB();

  const [category, totalCategories] = await Promise.all([
    Category.findOne({ _id: id, userId }).lean(),
    Category.countDocuments({ userId }),
  ]);
  if (!category) {
    return { success: false as const, error: "Category not found" };
  }
  if (totalCategories <= 1) {
    return { success: false as const, error: "You need at least one category" };
  }

  const itemCount = await ChecklistItem.countDocuments({ userId, category: category.name });

  if (itemCount > 0) {
    if (!moveItemsTo) {
      return { success: false as const, error: "MOVE_REQUIRED" as const, itemCount };
    }
    const target = await Category.findOne({ _id: moveItemsTo, userId }).lean();
    if (!target) {
      return { success: false as const, error: "Target category not found" };
    }
    await ChecklistItem.updateMany(
      { userId, category: category.name },
      { category: target.name },
    );
  }

  await Category.deleteOne({ _id: id, userId });
  return { success: true as const };
}
