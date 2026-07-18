/**
 * Backfills the new "Hobbies" checklist category onto existing users who already have a
 * Category collection populated. Category.ts's `ensureDefaultCategories` only seeds a user's
 * default folders once (existingCount === 0), so a category added to DEFAULT_CHECKLIST_CATEGORIES
 * after launch — see backend/src/types.ts — never reaches anyone who already onboarded. Users
 * with zero categories don't need this: their next checklist load seeds fresh from the live
 * catalog (which already includes Hobbies once `npm run seed:checklist-taxonomy` has imported
 * its items) and picks it up automatically.
 *
 * Idempotent — safe to re-run; skips users who already have a Hobbies category.
 *
 * Usage: npm run categories:add-hobbies
 */
import "dotenv/config";
import mongoose from "mongoose";

import { User } from "@/models/User";
import { Category } from "@/models/Category";

const HOBBIES_NAME = "Hobbies";
const HOBBIES_NORMALIZED = "hobbies";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  const users = await User.find().select("_id").lean();

  let added = 0;
  let alreadyHad = 0;
  let noCategoriesYet = 0;

  for (const user of users) {
    const existingCount = await Category.countDocuments({ userId: user._id });
    if (existingCount === 0) {
      noCategoriesYet += 1;
      continue;
    }

    const exists = await Category.findOne({ userId: user._id, normalizedName: HOBBIES_NORMALIZED }).lean();
    if (exists) {
      alreadyHad += 1;
      continue;
    }

    await Category.create({ userId: user._id, name: HOBBIES_NAME, normalizedName: HOBBIES_NORMALIZED });
    added += 1;
  }

  console.log(
    `Added "Hobbies" for ${added} user(s); ${alreadyHad} already had it; ${noCategoriesYet} have no categories yet (will seed it automatically on first checklist load).`,
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to backfill Hobbies category:", error);
  process.exit(1);
});
