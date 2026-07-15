import { connectDB } from "@/db";
import { ChecklistTemplate } from "@/models/ChecklistTemplate";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/defaultChecklistTemplate";

/** Populates a template that has zero DefaultChecklistItem rows with the hardcoded starter
 * checklist, so `findApplicableItems` never comes back empty just because nobody has run the
 * admin taxonomy importer (scripts/seedChecklistTaxonomy.ts) yet. Items are unrestricted
 * (visible to every college category / course / gender) — admins can narrow targeting later
 * via the taxonomy panel. Safe to call repeatedly: only inserts when the template is empty. */
async function ensureTemplateHasDefaultItems(templateId: string) {
  const hasItems = await DefaultChecklistItem.exists({ templateId });
  if (hasItems) return;

  const docs = DEFAULT_CHECKLIST_TEMPLATE.map((item, index) => ({
    templateId,
    category: item.category,
    title: item.item,
    description: item.description ?? "",
    priority: item.priority,
    sortOrder: index,
    isForAllCollegeCategories: true,
    isForAllCourses: true,
    active: true,
  }));

  try {
    await DefaultChecklistItem.insertMany(docs, { ordered: false });
  } catch (error) {
    // A concurrent request may have seeded first — fine, the exists() check above already
    // avoids duplicating on the common path. Anything else is a real failure and must surface,
    // or the catalog can be left silently empty with no trace of why.
    console.error(`ensureTemplateHasDefaultItems: insertMany failed for template ${templateId}`, error);
  }
}

/** Idempotent bootstrap: every environment needs at least one active template with default
 * items before checklist generation can produce anything. Safe to call on every request that
 * needs it — only creates "Default Template" v1 the first time, and self-heals a template left
 * empty by a skipped/failed taxonomy import.
 *
 * Two near-simultaneous first-ever calls (no template exists yet) could previously each create
 * their own "active" template, and `findOne({active:true}).sort({version:-1})` has no tiebreaker
 * for same-version ties — so different requests could non-deterministically resolve to different
 * duplicate templates, and items seeded under one wouldn't be visible to a call that landed on
 * the other. Sorting by `_id` as a deterministic tiebreaker, and collapsing any duplicates found
 * down to that one canonical template, closes that gap. */
export async function getOrCreateActiveTemplate() {
  await connectDB();

  const activeTemplates = await ChecklistTemplate.find({ active: true }).sort({ version: -1, _id: 1 }).lean();
  if (activeTemplates.length > 0) {
    const [canonical, ...duplicates] = activeTemplates;
    if (duplicates.length > 0) {
      await ChecklistTemplate.updateMany({ _id: { $in: duplicates.map((t) => t._id) } }, { active: false });
    }
    await ensureTemplateHasDefaultItems(String(canonical._id));
    return canonical;
  }

  const template = await ChecklistTemplate.create({
    name: "Default Template",
    version: 1,
    description: "Master packing checklist template",
    published: true,
    active: true,
  });
  await ensureTemplateHasDefaultItems(String(template._id));
  return template;
}

export async function listChecklistTemplates() {
  await connectDB();
  return ChecklistTemplate.find().sort({ version: -1 }).lean();
}

export async function createChecklistTemplate(input: { name: string; description?: string; version?: number }) {
  await connectDB();
  const latest = await ChecklistTemplate.findOne().sort({ version: -1 }).lean();
  const version = input.version ?? (latest ? latest.version + 1 : 1);
  const template = await ChecklistTemplate.create({
    name: input.name.trim(),
    version,
    description: input.description ?? "",
    published: false,
    active: false,
  });
  return { success: true as const, template };
}

export async function updateChecklistTemplate(
  id: string,
  input: { name?: string; description?: string; published?: boolean; active?: boolean },
) {
  await connectDB();

  // Only one template is ever "active" (the one checklist generation reads from) — activating
  // this one deactivates every other.
  if (input.active) {
    await ChecklistTemplate.updateMany({ _id: { $ne: id } }, { active: false });
  }

  const template = await ChecklistTemplate.findByIdAndUpdate(id, input, { returnDocument: "after" }).lean();
  if (!template) {
    return { success: false as const, error: "Template not found" };
  }
  return { success: true as const, template };
}
