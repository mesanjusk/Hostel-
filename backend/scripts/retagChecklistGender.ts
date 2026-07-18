/**
 * One-off migration: retags already-seeded DefaultChecklistItem docs whose title matches a
 * template item that now carries a non-"All" `gender` (see defaultChecklistTemplate.ts —
 * currently just "Trimmer / Razor" -> Male and "Sanitary Products" -> Female).
 *
 * Why this can't just be `seed:checklist-taxonomy` or ensureTemplateHasDefaultItems: both of
 * those are additive-only by design (they only ever touch a doc that doesn't exist yet), so
 * that production is protected from accidentally clobbering an admin's manual edit on every
 * deploy. Retargeting gender on a doc that already exists needs its own explicit, narrowly
 * scoped pass.
 *
 * Idempotent and safe to rerun: matched by templateId + category + title (same matching as
 * seedChecklistTaxonomy.ts), and only ever flips a doc whose gender is CURRENTLY exactly "All"
 * — the untouched default — to the template's target gender. A doc an admin already retargeted
 * (to anything other than "All") is left alone.
 *
 * Known limitation (accepted, no edit-tracking flag exists yet on DefaultChecklistItem): if an
 * admin manually sets one of these two items back to "All" after this runs, the next deploy's
 * run of this same script will re-tag it right back to Male/Female, since "currently All" is
 * the only signal available to distinguish "never touched" from "admin deliberately reset it".
 *
 * Usage: npm run migrate:checklist-gender
 */
import "dotenv/config";
import mongoose from "mongoose";

import { ChecklistTemplate } from "@/models/ChecklistTemplate";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/defaultChecklistTemplate";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  const targetedItems = DEFAULT_CHECKLIST_TEMPLATE.filter(
    (item) => item.gender && item.gender !== "All",
  );
  if (targetedItems.length === 0) {
    console.log("No gender-targeted template items to retag. Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  const templates = await ChecklistTemplate.find({}).lean();
  let retagged = 0;
  let skipped = 0;

  for (const template of templates) {
    for (const item of targetedItems) {
      const result = await DefaultChecklistItem.updateMany(
        {
          templateId: template._id,
          category: item.category,
          title: { $regex: `^${escapeRegExp(item.item)}$`, $options: "i" },
          // Only ever flip a doc still on the untouched default — never overwrite a gender an
          // admin deliberately set (including one they deliberately set back to "All").
          gender: "All",
        },
        { $set: { gender: item.gender } },
      );
      retagged += result.modifiedCount;

      const alreadyDone = await DefaultChecklistItem.countDocuments({
        templateId: template._id,
        category: item.category,
        title: { $regex: `^${escapeRegExp(item.item)}$`, $options: "i" },
        gender: { $ne: "All" },
      });
      skipped += alreadyDone - result.modifiedCount;

      console.log(
        `  - "${item.item}" (template ${template._id}): retagged ${result.modifiedCount} -> ${item.gender}`,
      );
    }
  }

  console.log(`Done. Retagged ${retagged} doc(s), left ${Math.max(skipped, 0)} already-non-"All" doc(s) untouched.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to retag checklist gender:", error);
  process.exit(1);
});
