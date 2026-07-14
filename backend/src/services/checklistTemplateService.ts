import { connectDB } from "@/db";
import { ChecklistTemplate } from "@/models/ChecklistTemplate";

/** Idempotent bootstrap: every environment needs at least one active template before default
 * items can be created against it. Safe to call on every request that needs it — only creates
 * "Default Template" v1 the first time. */
export async function getOrCreateActiveTemplate() {
  await connectDB();

  const existing = await ChecklistTemplate.findOne({ active: true }).sort({ version: -1 }).lean();
  if (existing) return existing;

  return ChecklistTemplate.create({
    name: "Default Template",
    version: 1,
    description: "Master packing checklist template",
    published: true,
    active: true,
  });
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
