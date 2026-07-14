import { connectDB } from "@/db";
import { CollegeCategory } from "@/models/CollegeCategory";
import { Course } from "@/models/Course";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { User } from "@/models/User";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Public listing — active categories only, for onboarding/profile dropdowns. */
export async function listActiveCollegeCategories() {
  await connectDB();
  return CollegeCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
}

/** Admin listing — everything, with optional search. */
export async function listAllCollegeCategories(search?: string) {
  await connectDB();
  const filter = search ? { name: { $regex: search, $options: "i" } } : {};
  return CollegeCategory.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function createCollegeCategory(input: {
  name: string;
  icon?: string | null;
  description?: string;
  sortOrder?: number;
}) {
  await connectDB();

  const name = input.name.trim();
  const slug = slugify(name);
  const existing = await CollegeCategory.findOne({ slug }).lean();
  if (existing) {
    return { success: false as const, error: "A category with this name already exists" };
  }

  const category = await CollegeCategory.create({
    name,
    slug,
    icon: input.icon ?? null,
    description: input.description ?? "",
    sortOrder: input.sortOrder ?? 0,
  });
  return { success: true as const, category };
}

export async function updateCollegeCategory(
  id: string,
  input: { name?: string; icon?: string | null; description?: string; sortOrder?: number; active?: boolean },
) {
  await connectDB();

  const patch: Record<string, unknown> = { ...input };
  if (input.name !== undefined) {
    const name = input.name.trim();
    const slug = slugify(name);
    const clash = await CollegeCategory.findOne({ slug, _id: { $ne: id } }).lean();
    if (clash) {
      return { success: false as const, error: "A category with this name already exists" };
    }
    patch.name = name;
    patch.slug = slug;
  }

  const category = await CollegeCategory.findByIdAndUpdate(id, patch, { returnDocument: "after" }).lean();
  if (!category) {
    return { success: false as const, error: "Category not found" };
  }
  return { success: true as const, category };
}

/** Categories are never hard-deleted once referenced anywhere (courses, default items, users)
 * — deactivating keeps history and analytics intact. Only an unused, never-referenced category
 * can be removed outright. */
export async function deleteCollegeCategory(id: string) {
  await connectDB();

  const [courseCount, itemCount, userCount] = await Promise.all([
    Course.countDocuments({ collegeCategoryId: id }),
    DefaultChecklistItem.countDocuments({ applicableCollegeCategories: id }),
    User.countDocuments({ collegeCategoryId: id }),
  ]);

  if (courseCount > 0 || itemCount > 0 || userCount > 0) {
    return {
      success: false as const,
      error: "This category is in use (courses, checklist items, or students reference it). Deactivate it instead.",
    };
  }

  await CollegeCategory.deleteOne({ _id: id });
  return { success: true as const };
}
