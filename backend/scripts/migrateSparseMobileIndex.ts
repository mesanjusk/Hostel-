/**
 * One-time migration: rebuilds User's `mobile_1` index as sparse+unique instead of the old
 * plain unique index.
 *
 * Before this feature, every User document had a required `mobile`, so a plain unique index
 * was correct. Anonymous visitor accounts (see userService.createAnonymousUser) now exist with
 * no `mobile` field at all — a plain unique index treats "missing" the same as any other value
 * and would reject the second anonymous account it ever sees. `sparse: true` tells MongoDB to
 * simply skip documents missing the field when enforcing uniqueness, which is exactly what's
 * needed: uniqueness still holds for every document that *has* a mobile, and anonymous accounts
 * are invisible to the index entirely.
 *
 * The Mongoose schema already declares the field as `{ unique: true, sparse: true }`, but
 * Mongoose never alters an existing index definition on an already-deployed collection by
 * itself — this has to run once, explicitly, against the real database.
 *
 * Usage:
 *   npm run migrate:sparse-mobile-index
 */
import "dotenv/config";
import mongoose from "mongoose";

import { User } from "@/models/User";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  const existing = await User.collection.indexes();
  const mobileIndex = existing.find((idx) => idx.key && Object.keys(idx.key).length === 1 && "mobile" in idx.key);

  if (!mobileIndex) {
    console.log("No existing index on `mobile` found — creating the sparse+unique index directly.");
  } else if (mobileIndex.sparse && mobileIndex.unique) {
    console.log("`mobile` index is already sparse+unique — nothing to do.");
    await mongoose.disconnect();
    return;
  } else {
    console.log(`Dropping existing non-sparse index "${mobileIndex.name}" on \`mobile\`...`);
    await User.collection.dropIndex(mobileIndex.name!);
  }

  console.log("Creating sparse+unique index on `mobile`...");
  await User.collection.createIndex({ mobile: 1 }, { unique: true, sparse: true });

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Migration script crashed:", error);
  process.exit(1);
});
