import { connectDB } from "@/db";
import { Bag } from "@/models/Bag";
import { ChecklistItem } from "@/models/ChecklistItem";
import { UserChecklist } from "@/models/UserChecklist";
import { listNormalizedChecklistItems, userUsesNormalizedChecklist } from "@/services/checklistService";
import { BAG_COLOR_PRESETS } from "@/types";

function normalize(name: string) {
  return name.trim().toLowerCase();
}

/** Idempotent: gives a brand-new user one suitcase to start with, so the Bags tab never
 * opens empty. Mirrors ensureDefaultCategories' "seed once, then leave alone" approach. */
async function ensureDefaultBag(userId: string) {
  const existingCount = await Bag.countDocuments({ userId });
  if (existingCount > 0) return;

  await Bag.create({ userId, name: "My Suitcase", color: BAG_COLOR_PRESETS[0] }).catch(() => {});
}

/** Bags tab overview: every bag a user has, with packed/total counts of the checklist
 * items currently assigned to it. Bags never store items themselves — only the
 * ChecklistItem.bagId reference is the source of truth. */
export async function listBagsWithCounts(userId: string) {
  await connectDB();
  await ensureDefaultBag(userId);

  const normalized = await userUsesNormalizedChecklist(userId);
  const [bags, items] = await Promise.all([
    Bag.find({ userId }).sort({ createdAt: 1 }).lean(),
    normalized
      ? UserChecklist.find({ userId, deleted: false, bagId: { $ne: null } }).select("bagId checked").lean()
      : ChecklistItem.find({ userId, bagId: { $ne: null } }).select("bagId completed").lean(),
  ]);

  return bags.map((bag) => {
    const assigned = items.filter((i) => String(i.bagId) === String(bag._id));
    return {
      id: String(bag._id),
      name: bag.name,
      color: bag.color ?? BAG_COLOR_PRESETS[0],
      total: assigned.length,
      completed: assigned.filter((i) => normalized ? Boolean("checked" in i && i.checked) : Boolean("completed" in i && i.completed)).length,
    };
  });
}

export async function getBagWithItems(userId: string, id: string) {
  await connectDB();

  const bag = await Bag.findOne({ _id: id, userId }).lean();
  if (!bag) return null;

  const items = (await userUsesNormalizedChecklist(userId))
    ? await listNormalizedChecklistItems(userId, { bagId: id })
    : await ChecklistItem.find({ userId, bagId: id }).sort({ createdAt: -1 }).lean();
  return { bag, items };
}

export async function createBag(userId: string, name: string, color?: string) {
  await connectDB();

  const trimmed = name.trim();
  const existing = await Bag.find({ userId }).lean();
  const clash = existing.some((b) => normalize(b.name) === normalize(trimmed));
  if (clash) {
    return { success: false as const, error: "A bag with this name already exists" };
  }

  const bag = await Bag.create({ userId, name: trimmed, ...(color ? { color } : {}) });
  return { success: true as const, bag };
}

export async function updateBag(
  userId: string,
  id: string,
  updates: { name?: string; color?: string },
) {
  await connectDB();

  const current = await Bag.findOne({ _id: id, userId }).lean();
  if (!current) {
    return { success: false as const, error: "Bag not found" };
  }

  const patch: { name?: string; color?: string } = {};

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    const existing = await Bag.find({ userId, _id: { $ne: id } }).lean();
    const clash = existing.some((b) => normalize(b.name) === normalize(trimmed));
    if (clash) {
      return { success: false as const, error: "A bag with this name already exists" };
    }
    patch.name = trimmed;
  }

  if (updates.color !== undefined) {
    patch.color = updates.color;
  }

  await Bag.updateOne({ _id: id, userId }, patch);
  return { success: true as const };
}

/** Deleting a bag unassigns (never deletes) the checklist items that referenced it. */
export async function deleteBag(userId: string, id: string) {
  await connectDB();

  const bag = await Bag.findOne({ _id: id, userId }).lean();
  if (!bag) {
    return { success: false as const, error: "Bag not found" };
  }

  if (await userUsesNormalizedChecklist(userId)) {
    await UserChecklist.updateMany({ userId, bagId: id }, { bagId: null });
  } else {
    await ChecklistItem.updateMany({ userId, bagId: id }, { bagId: null });
  }
  await Bag.deleteOne({ _id: id, userId });
  return { success: true as const };
}
