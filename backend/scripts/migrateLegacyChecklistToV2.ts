/**
 * Migration Phase 5: converts existing users' legacy ChecklistItem rows into the new
 * UserChecklist shape. Strictly additive and opt-in — never touches or deletes ChecklistItem,
 * never runs automatically (must be invoked explicitly), and is per-user transactional: each
 * user is validated after migrating and rolled back individually on mismatch, so one bad user
 * never blocks the rest.
 *
 * Matching: a legacy item is linked to a DefaultChecklistItem when its (category, title)
 * matches case-insensitively; otherwise it becomes a custom UserChecklist row, preserving its
 * name/category. Per-item rich fields that only exist on the legacy schema (price, brand,
 * purchase link, student rating, description) have no home on a master-linked row — the new
 * schema deliberately doesn't duplicate master metadata — so when a legacy item differs from
 * its matched master on price/brand/link, or when it's unmatched and had prose worth keeping,
 * that detail is folded into `note` rather than silently dropped.
 *
 * Usage:
 *   npm run migrate:checklist-v2 -- --dry-run       (report only, no writes)
 *   npm run migrate:checklist-v2 -- --user=<userId> (single user)
 *   npm run migrate:checklist-v2                    (all users not yet migrated)
 */
import "dotenv/config";
import mongoose from "mongoose";

import { User } from "@/models/User";
import { ChecklistItem } from "@/models/ChecklistItem";
import { UserChecklist } from "@/models/UserChecklist";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";

interface MigrationResult {
  userId: string;
  legacyCount: number;
  migratedCount: number;
  ok: boolean;
  error?: string;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

async function migrateUser(userId: string, masters: { _id: mongoose.Types.ObjectId; category: string; title: string; recommendedBrand: string | null; estimatedPrice: number | null; purchaseLink: string | null }[], dryRun: boolean): Promise<MigrationResult> {
  const alreadyMigrated = await UserChecklist.countDocuments({ userId });
  if (alreadyMigrated > 0) {
    return { userId, legacyCount: 0, migratedCount: 0, ok: true, error: "already migrated, skipped" };
  }

  const legacyItems = await ChecklistItem.find({ userId }).lean();
  if (legacyItems.length === 0) {
    return { userId, legacyCount: 0, migratedCount: 0, ok: true };
  }

  const masterByKey = new Map(masters.map((m) => [`${normalize(m.category)}::${normalize(m.title)}`, m]));

  const docs = legacyItems.map((item) => {
    const key = `${normalize(item.category)}::${normalize(item.item)}`;
    const master = masterByKey.get(key);

    const extraDetails: string[] = [];
    if (master) {
      if (item.recommendedBrand && item.recommendedBrand !== master.recommendedBrand) {
        extraDetails.push(`brand: ${item.recommendedBrand}`);
      }
      if (item.price != null && item.price !== master.estimatedPrice) {
        extraDetails.push(`price: ₹${item.price}`);
      }
      if (item.purchaseLink && item.purchaseLink !== master.purchaseLink) {
        extraDetails.push(`link: ${item.purchaseLink}`);
      }
    } else {
      if (item.description) extraDetails.push(item.description);
      if (item.recommendedBrand) extraDetails.push(`brand: ${item.recommendedBrand}`);
      if (item.price != null) extraDetails.push(`price: ₹${item.price}`);
    }

    const note = [item.notes, extraDetails.length > 0 ? `[migrated: ${extraDetails.join(", ")}]` : null]
      .filter(Boolean)
      .join(" ")
      .trim();

    const base = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(userId),
      checked: item.completed,
      quantity: 1,
      note,
      bagId: item.bagId ?? null,
      metadataVersion: 1,
      deleted: false,
      createdAt: (item as unknown as { createdAt: Date }).createdAt,
      updatedAt: (item as unknown as { updatedAt: Date }).updatedAt,
    };

    if (master) {
      return { ...base, defaultChecklistItemId: master._id, isCustomItem: false, customName: null, customCategory: null, customOrder: 0 };
    }
    return {
      ...base,
      defaultChecklistItemId: null,
      isCustomItem: true,
      customName: item.item,
      customCategory: item.category,
      customOrder: 0,
    };
  });

  if (dryRun) {
    return { userId, legacyCount: legacyItems.length, migratedCount: docs.length, ok: true };
  }

  try {
    // Raw collection insertMany (bypassing Mongoose's timestamps:true auto-overwrite) so the
    // original createdAt/updatedAt are preserved exactly, per "Preserve ... timestamps.
    // Everything."
    await UserChecklist.collection.insertMany(docs);

    // --- Validation: every legacy dimension must reconcile 1:1 before we call this a success.
    const inserted = await UserChecklist.find({ userId }).lean();
    const checks = {
      count: inserted.length === legacyItems.length,
      checked: inserted.filter((i) => i.checked).length === legacyItems.filter((i) => i.completed).length,
      customItems:
        inserted.filter((i) => i.isCustomItem).length ===
        legacyItems.filter((i) => !masterByKey.has(`${normalize(i.category)}::${normalize(i.item)}`)).length,
      bagAssignments:
        inserted.filter((i) => i.bagId).length === legacyItems.filter((i) => i.bagId).length,
    };

    const failed = Object.entries(checks).filter(([, passed]) => !passed);
    if (failed.length > 0) {
      await UserChecklist.deleteMany({ userId });
      return {
        userId,
        legacyCount: legacyItems.length,
        migratedCount: 0,
        ok: false,
        error: `validation failed: ${failed.map(([name]) => name).join(", ")} — rolled back`,
      };
    }

    return { userId, legacyCount: legacyItems.length, migratedCount: inserted.length, ok: true };
  } catch (error) {
    await UserChecklist.deleteMany({ userId }).catch(() => {});
    return {
      userId,
      legacyCount: legacyItems.length,
      migratedCount: 0,
      ok: false,
      error: error instanceof Error ? error.message : "unknown error — rolled back",
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const userArg = args.find((a) => a.startsWith("--user="));
  const singleUserId = userArg?.split("=")[1];

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  const masters = await DefaultChecklistItem.find()
    .select("category title recommendedBrand estimatedPrice purchaseLink")
    .lean();

  const userIds = singleUserId
    ? [singleUserId]
    : (await ChecklistItem.distinct("userId")).map((id) => String(id));

  console.log(`${dryRun ? "[DRY RUN] " : ""}Migrating ${userIds.length} user(s)...`);

  const results: MigrationResult[] = [];
  for (const userId of userIds) {
    const userExists = await User.exists({ _id: userId });
    if (!userExists) continue;
    const result = await migrateUser(userId, masters as any, dryRun);
    results.push(result);
    const status = result.ok ? "OK" : "FAILED";
    console.log(`  [${status}] user=${userId} legacy=${result.legacyCount} migrated=${result.migratedCount}${result.error ? ` (${result.error})` : ""}`);
  }

  const failures = results.filter((r) => !r.ok);
  console.log("\nSummary:");
  console.log(`  Users processed: ${results.length}`);
  console.log(`  Succeeded: ${results.length - failures.length}`);
  console.log(`  Failed (rolled back): ${failures.length}`);
  if (failures.length > 0) {
    console.log("  Failed user ids:", failures.map((f) => f.userId).join(", "));
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Migration script crashed:", error);
  process.exit(1);
});
