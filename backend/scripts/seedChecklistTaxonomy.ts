/**
 * Migration Phase 1 + 2: creates the new DB-driven checklist collections and imports the
 * existing hardcoded DEFAULT_CHECKLIST_TEMPLATE into DefaultChecklistItem.
 *
 * Idempotent — safe to re-run. Never touches User, ChecklistItem, or UserChecklist; purely
 * additive (CollegeCategory / Course / ChecklistTemplate / DefaultChecklistItem).
 *
 * Usage: npm run seed:checklist-taxonomy
 */
import "dotenv/config";
import mongoose from "mongoose";

import { CollegeCategory } from "@/models/CollegeCategory";
import { Course } from "@/models/Course";
import { ChecklistTemplate } from "@/models/ChecklistTemplate";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/defaultChecklistTemplate";

const CATEGORIES = [
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

// Only "Design" needs a starter course list right now — it's the only category the legacy
// template actually targets (the "Fashion Design Tools" items, gated on collegeCategory ===
// "Designing"). Everything else gets no starter courses; admins add their own via the panel.
const STARTER_COURSES: Record<string, string[]> = {
  Design: ["Fashion Design", "Graphic Design", "Interior Design", "Textile Design"],
};

const DESIGN_ONLY_CATEGORY = "Fashion Design Tools";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  console.log("Phase 1: college categories + courses");
  const categoryIdByName = new Map<string, string>();
  for (const [index, name] of CATEGORIES.entries()) {
    const slug = slugify(name);
    const doc = await CollegeCategory.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug, sortOrder: index, active: true } },
      { upsert: true, returnDocument: "after" },
    );
    categoryIdByName.set(name, String(doc!._id));
    console.log(`  - ${name} (${doc!._id})`);
  }

  const courseIdByCategoryAndName = new Map<string, string>();
  for (const [categoryName, courseNames] of Object.entries(STARTER_COURSES)) {
    const collegeCategoryId = categoryIdByName.get(categoryName);
    if (!collegeCategoryId) continue;
    for (const [index, courseName] of courseNames.entries()) {
      const slug = slugify(courseName);
      const doc = await Course.findOneAndUpdate(
        { collegeCategoryId, slug },
        { $setOnInsert: { collegeCategoryId, name: courseName, slug, sortOrder: index, active: true } },
        { upsert: true, returnDocument: "after" },
      );
      courseIdByCategoryAndName.set(`${categoryName}::${courseName}`, String(doc!._id));
      console.log(`  - ${categoryName} > ${courseName} (${doc!._id})`);
    }
  }

  console.log("Phase 2: checklist template + default items");
  let template = await ChecklistTemplate.findOne({ active: true });
  if (!template) {
    template = await ChecklistTemplate.create({
      name: "Default Template",
      version: 1,
      description: "Imported from the legacy DEFAULT_CHECKLIST_TEMPLATE starter checklist",
      published: true,
      active: true,
    });
  }
  console.log(`  Using template "${template.name}" v${template.version} (${template._id})`);

  const designCategoryId = categoryIdByName.get("Design");
  const fashionDesignCourseId = courseIdByCategoryAndName.get("Design::Fashion Design");

  let imported = 0;
  let skipped = 0;
  for (const [index, templateItem] of DEFAULT_CHECKLIST_TEMPLATE.entries()) {
    const isDesignOnly = templateItem.category === DESIGN_ONLY_CATEGORY;

    const existing = await DefaultChecklistItem.findOne({
      templateId: template._id,
      category: templateItem.category,
      title: { $regex: `^${escapeRegExp(templateItem.item)}$`, $options: "i" },
    }).lean();
    if (existing) {
      skipped += 1;
      continue;
    }

    await DefaultChecklistItem.create({
      templateId: template._id,
      category: templateItem.category,
      title: templateItem.item,
      description: templateItem.description ?? "",
      priority: templateItem.priority,
      sortOrder: index,
      applicableCollegeCategories: isDesignOnly && designCategoryId ? [designCategoryId] : [],
      applicableCourses: isDesignOnly && fashionDesignCourseId ? [fashionDesignCourseId] : [],
      isForAllCollegeCategories: !isDesignOnly,
      isForAllCourses: !isDesignOnly,
      active: true,
    });
    imported += 1;
  }

  console.log(`  Imported ${imported} default items, skipped ${skipped} already present.`);
  console.log("Done. Legacy ChecklistItem / DEFAULT_CHECKLIST_TEMPLATE are untouched.");

  await mongoose.disconnect();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch((error) => {
  console.error("Failed to seed checklist taxonomy:", error);
  process.exit(1);
});
