import { connectDB } from "@/db";
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

/** Public listing — active courses for a given category, for onboarding/profile dropdowns. */
export async function listActiveCoursesByCategory(collegeCategoryId: string) {
  await connectDB();
  return Course.find({ collegeCategoryId, active: true }).sort({ sortOrder: 1, name: 1 }).lean();
}

/** Admin listing — everything, optionally filtered by category and/or search. */
export async function listAllCourses(filters: { collegeCategoryId?: string; search?: string } = {}) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.collegeCategoryId) query.collegeCategoryId = filters.collegeCategoryId;
  if (filters.search) query.name = { $regex: filters.search, $options: "i" };
  return Course.find(query).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function createCourse(input: {
  collegeCategoryId: string;
  name: string;
  description?: string;
  sortOrder?: number;
}) {
  await connectDB();

  const name = input.name.trim();
  const slug = slugify(name);
  const existing = await Course.findOne({ collegeCategoryId: input.collegeCategoryId, slug }).lean();
  if (existing) {
    return { success: false as const, error: "A course with this name already exists in this category" };
  }

  const course = await Course.create({
    collegeCategoryId: input.collegeCategoryId,
    name,
    slug,
    description: input.description ?? "",
    sortOrder: input.sortOrder ?? 0,
  });
  return { success: true as const, course };
}

export async function updateCourse(
  id: string,
  input: {
    collegeCategoryId?: string;
    name?: string;
    description?: string;
    sortOrder?: number;
    active?: boolean;
  },
) {
  await connectDB();

  const current = await Course.findById(id).lean();
  if (!current) {
    return { success: false as const, error: "Course not found" };
  }

  const patch: Record<string, unknown> = { ...input };
  if (input.name !== undefined) {
    const name = input.name.trim();
    const slug = slugify(name);
    const categoryId = input.collegeCategoryId ?? current.collegeCategoryId;
    const clash = await Course.findOne({ collegeCategoryId: categoryId, slug, _id: { $ne: id } }).lean();
    if (clash) {
      return { success: false as const, error: "A course with this name already exists in this category" };
    }
    patch.name = name;
    patch.slug = slug;
  }

  const course = await Course.findByIdAndUpdate(id, patch, { returnDocument: "after" }).lean();
  return { success: true as const, course };
}

export async function deleteCourse(id: string) {
  await connectDB();

  const [itemCount, userCount] = await Promise.all([
    DefaultChecklistItem.countDocuments({ applicableCourses: id }),
    User.countDocuments({ courseId: id }),
  ]);

  if (itemCount > 0 || userCount > 0) {
    return {
      success: false as const,
      error: "This course is in use (checklist items or students reference it). Deactivate it instead.",
    };
  }

  await Course.deleteOne({ _id: id });
  return { success: true as const };
}
