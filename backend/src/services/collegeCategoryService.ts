import { connectDB } from "@/db";
import { CollegeCategory } from "@/models/CollegeCategory";
import { Course } from "@/models/Course";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { User } from "@/models/User";
import { escapeRegex } from "@/lib/regex";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const BASELINE_CATEGORIES = [
  "Design",
  "Engineering",
  "Medical",
  "Commerce",
  "Law",
  "Science",
  "Arts",
  "Architecture",
  "Animation",
  "Hotel Management",
  "Agriculture",
  "Management",
  "Other",
];

// Every category needs at least one selectable course, since onboarding requires both a
// category and a course — Design gets its real starter list, everything else gets a single
// "General" placeholder admins can replace/expand later via the taxonomy panel.
const DESIGN_STARTER_COURSES = ["Fashion Design", "Graphic Design", "Interior Design", "Textile Design"];

/** Self-heal: onboarding's category/course selects have nothing to show — and registration
 * can never be completed — until this taxonomy exists, but it was only ever populated by a
 * manual, never-auto-run script (scripts/seedChecklistTaxonomy.ts). Seeds a baseline the first
 * time the collection is found empty, so a fresh/unconfigured environment doesn't permanently
 * block every new signup. Safe to call on every request that needs the list. */
async function ensureBaselineCategoriesSeeded() {
  const hasAny = await CollegeCategory.exists({});
  if (hasAny) return;

  for (const [index, name] of BASELINE_CATEGORIES.entries()) {
    const slug = slugify(name);
    // findOneAndUpdate + upsert (rather than a plain create) so a concurrent request racing
    // the same first-seed moment can't crash on the unique slug index — both just converge on
    // the same document.
    const category = await CollegeCategory.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug, sortOrder: index, active: true } },
      { upsert: true, returnDocument: "after" },
    );

    const courseNames = name === "Design" ? DESIGN_STARTER_COURSES : ["General"];
    for (const [courseIndex, courseName] of courseNames.entries()) {
      const courseSlug = slugify(courseName);
      await Course.findOneAndUpdate(
        { collegeCategoryId: category._id, slug: courseSlug },
        { $setOnInsert: { collegeCategoryId: category._id, name: courseName, slug: courseSlug, sortOrder: courseIndex, active: true } },
        { upsert: true, returnDocument: "after" },
      );
    }
  }
}

/** Public listing — active categories only, for onboarding/profile dropdowns. */
export async function listActiveCollegeCategories() {
  await connectDB();
  await ensureBaselineCategoriesSeeded();
  return CollegeCategory.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
}

/** Admin listing — everything, with optional search. */
export async function listAllCollegeCategories(search?: string) {
  await connectDB();
  const filter = search ? { name: { $regex: escapeRegex(search), $options: "i" } } : {};
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
