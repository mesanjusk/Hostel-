import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "@/db";
import { ChecklistItem } from "@/models/ChecklistItem";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { UserChecklist } from "@/models/UserChecklist";
import { ensureChecklistMasterData, normalizeTitle } from "@/services/checklistMasterService";

async function migrateUser(userId: string) {
  const existing = await UserChecklist.countDocuments({ userId });
  if (existing > 0) return { userId, skipped: true };
  const legacy = await ChecklistItem.find({ userId }).lean();
  const masters = await DefaultChecklistItem.find().lean();
  const byName = new Map(masters.map((m) => [normalizeTitle(m.title), m]));
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const docs = legacy.map((item: any, index) => {
        const master = byName.get(normalizeTitle(item.item));
        return { userId, defaultChecklistItemId: master?._id ?? null, checked: Boolean(item.completed), quantity: 1, note: item.notes ?? "", bagId: item.bagId ?? null, customName: master ? null : item.item, customCategory: master ? null : item.category, isCustomItem: !master, customOrder: index, metadataVersion: master?.__v ?? 1, deleted: false, createdAt: item.createdAt, updatedAt: item.updatedAt };
      });
      if (docs.length) await UserChecklist.insertMany(docs, { session });
      const [newCount, checkedCount, legacyChecked] = await Promise.all([UserChecklist.countDocuments({ userId }).session(session), UserChecklist.countDocuments({ userId, checked: true }).session(session), ChecklistItem.countDocuments({ userId, completed: true }).session(session)]);
      if (newCount !== legacy.length || checkedCount !== legacyChecked) throw new Error(`Validation failed for ${userId}`);
    });
    return { userId, migrated: legacy.length };
  } finally {
    await session.endSession();
  }
}

async function main() {
  await connectDB();
  await ensureChecklistMasterData();
  const userIds = await ChecklistItem.distinct("userId");
  const results = [];
  for (const id of userIds) {
    try {
      results.push(await migrateUser(String(id)));
    } catch (error) {
      results.push({ userId: String(id), error: error instanceof Error ? error.message : String(error) });
    }
  }
  console.log(JSON.stringify({ results }, null, 2));
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
