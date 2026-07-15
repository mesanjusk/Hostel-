import { connectDB } from "@/db";
import { ChecklistTemplate } from "@/models/ChecklistTemplate";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { CollegeCategory } from "@/models/CollegeCategory";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { UserChecklist } from "@/models/UserChecklist";
import { ChecklistItem } from "@/models/ChecklistItem";
import { Category } from "@/models/Category";
import { normalizeMobile } from "@/lib/phone";

/** Read-only diagnostic snapshot of the checklist-generation taxonomy — lets an admin confirm
 * whether the self-healing seed (getOrCreateActiveTemplate / listActiveCollegeCategories) has
 * actually produced data in this environment, without needing direct DB access. Optionally
 * inspects one user's own checklist state by mobile number. */
export async function getChecklistHealthSnapshot(mobile?: string) {
  await connectDB();

  const [templates, defaultItemCount, collegeCategoryCount, courseCount] = await Promise.all([
    ChecklistTemplate.find().sort({ version: -1 }).lean(),
    DefaultChecklistItem.countDocuments(),
    CollegeCategory.countDocuments(),
    Course.countDocuments(),
  ]);

  const templateSummaries = await Promise.all(
    templates.map(async (t) => ({
      id: String(t._id),
      name: t.name,
      version: t.version,
      active: t.active,
      itemCount: await DefaultChecklistItem.countDocuments({ templateId: t._id }),
    })),
  );

  const snapshot: Record<string, unknown> = {
    checklistTemplates: templateSummaries,
    defaultChecklistItemCount: defaultItemCount,
    collegeCategoryCount,
    courseCount,
  };

  const normalized = mobile ? normalizeMobile(mobile) : null;
  if (normalized) {
    const user = await User.findOne({ mobile: normalized }).lean();
    if (!user) {
      snapshot.user = { mobile: normalized, found: false };
    } else {
      const [userChecklistCount, legacyChecklistItemCount, categories, legacyItemCategories] = await Promise.all([
        UserChecklist.countDocuments({ userId: user._id }),
        ChecklistItem.countDocuments({ userId: user._id }),
        Category.find({ userId: user._id }).select("name").lean(),
        ChecklistItem.distinct("category", { userId: user._id }),
      ]);
      snapshot.user = {
        found: true,
        id: String(user._id),
        mobile: user.mobile,
        name: user.name ?? null,
        needsOnboarding: !user.name,
        collegeCategoryId: user.collegeCategoryId ? String(user.collegeCategoryId) : null,
        courseId: user.courseId ? String(user.courseId) : null,
        gender: user.gender ?? null,
        userChecklistCount,
        legacyChecklistItemCount,
        categoryFolderNames: categories.map((c) => c.name),
        legacyItemCategoryNames: legacyItemCategories,
      };
    }
  }

  return snapshot;
}
