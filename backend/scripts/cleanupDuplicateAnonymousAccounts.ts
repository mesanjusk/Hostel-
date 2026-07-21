/**
 * One-time cleanup for anonymous accounts duplicated by the (now-fixed) bug in
 * POST /api/auth/anonymous: before getOrCreateAnonymousUserByDeviceId (see userService.ts),
 * every retry of the anonymous-session bootstrap — an expired/rotated token, a dropped request
 * mid-bootstrap, two tabs racing on first load — created a brand-new User document instead of
 * reusing the existing one for that device, so the same browser could end up with several
 * anonymous accounts sharing one deviceId. Spotted in the admin Users > Anonymous tab: the same
 * device id appearing twice, one row with gender/college set and the other blank.
 *
 * Conservative by design: only ever deletes a duplicate that is completely empty — no profile
 * signal (name/gender/college/city/homeTown/avatar/interests/favorites/community setup/
 * verified) and zero documents in every collection a real account could have touched (the same
 * set userService.deleteUserByAdmin cleans up for a real account deletion). A device whose
 * duplicates include MORE THAN ONE account with actual data is left entirely alone and reported
 * under "needs manual review" — deciding which of two accounts with real data should win, or
 * how to combine them, is a human call, not this script's.
 *
 * Safe to delete an "empty" duplicate even when it's the one a browser's current JWT points to:
 * that browser's next authenticated request 401s, which re-triggers the anonymous-session
 * bootstrap, which now looks up by deviceId first (see getOrCreateAnonymousUserByDeviceId) and
 * simply adopts whichever empty account for that device survived — losing nothing, since by
 * definition there was nothing on it.
 *
 * Usage:
 *   npm run cleanup:duplicate-anonymous              (dry run — report only, no writes)
 *   npm run cleanup:duplicate-anonymous -- --apply    (actually deletes the safe duplicates)
 */
import "dotenv/config";
import mongoose from "mongoose";

import { User } from "@/models/User";
import { ChecklistItem } from "@/models/ChecklistItem";
import { UserChecklist } from "@/models/UserChecklist";
import { Category } from "@/models/Category";
import { BudgetEntry } from "@/models/BudgetEntry";
import { Note } from "@/models/Note";
import { DocumentItem } from "@/models/DocumentItem";
import { EmergencyContact } from "@/models/EmergencyContact";
import { WishlistItem } from "@/models/WishlistItem";
import { CommunityMember } from "@/models/CommunityMember";
import { TravelProfile } from "@/models/TravelProfile";
import { Connection } from "@/models/Connection";

interface AnonUserRow {
  _id: mongoose.Types.ObjectId;
  deviceId: string | null;
  name: string | null;
  gender: string | null;
  college: string | null;
  city: string | null;
  homeTown: string | null;
  avatar: string | null;
  interests: string[];
  favoritePlaceIds: mongoose.Types.ObjectId[];
  communityProfileConfigured: boolean;
  verified: boolean;
  createdAt: Date;
}

function hasProfileSignal(u: AnonUserRow): boolean {
  return Boolean(
    u.name ||
      u.gender ||
      u.college ||
      u.city ||
      u.homeTown ||
      u.avatar ||
      (u.interests && u.interests.length > 0) ||
      (u.favoritePlaceIds && u.favoritePlaceIds.length > 0) ||
      u.communityProfileConfigured ||
      u.verified,
  );
}

/** Same collection set as userService.deleteUserByAdmin — "everything a real account could
 * have touched" for this app. */
async function countLinkedDocs(userId: mongoose.Types.ObjectId): Promise<number> {
  const counts = await Promise.all([
    ChecklistItem.countDocuments({ userId }),
    UserChecklist.countDocuments({ userId }),
    Category.countDocuments({ userId }),
    BudgetEntry.countDocuments({ userId }),
    Note.countDocuments({ userId }),
    DocumentItem.countDocuments({ userId }),
    EmergencyContact.countDocuments({ userId }),
    WishlistItem.countDocuments({ userId }),
    CommunityMember.countDocuments({ userId }),
    TravelProfile.countDocuments({ userId }),
    Connection.countDocuments({ $or: [{ requesterId: userId }, { recipientId: userId }] }),
  ]);
  return counts.reduce((a, b) => a + b, 0);
}

async function main() {
  const apply = process.argv.includes("--apply");

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  const anonUsers = await User.find({ mobile: { $exists: false }, deviceId: { $ne: null } })
    .select(
      "deviceId name gender college city homeTown avatar interests favoritePlaceIds communityProfileConfigured verified createdAt",
    )
    .lean<AnonUserRow[]>();

  const groups = new Map<string, AnonUserRow[]>();
  for (const u of anonUsers) {
    if (!u.deviceId) continue;
    const list = groups.get(u.deviceId) ?? [];
    list.push(u);
    groups.set(u.deviceId, list);
  }

  const duplicateGroups = [...groups.entries()].filter(([, users]) => users.length > 1);

  console.log(
    `${apply ? "[APPLY] " : "[DRY RUN] "}Found ${duplicateGroups.length} device id(s) with duplicate anonymous accounts (out of ${groups.size} distinct devices, ${anonUsers.length} anonymous accounts total).`,
  );

  let totalSafeDeletes = 0;
  let totalNeedsReview = 0;

  for (const [deviceId, users] of duplicateGroups) {
    const withSignal: AnonUserRow[] = [];
    const empties: AnonUserRow[] = [];

    for (const u of users) {
      const linkedDocs = await countLinkedDocs(u._id);
      if (hasProfileSignal(u) || linkedDocs > 0) {
        withSignal.push(u);
      } else {
        empties.push(u);
      }
    }

    console.log(`\nDevice ${deviceId}: ${users.length} accounts (${withSignal.length} with data, ${empties.length} empty)`);

    if (withSignal.length > 1) {
      // More than one account for this device actually has real data — merging is a human
      // decision (which one wins on a conflicting field, whether to combine checklist rows,
      // etc.), so this script only flags it and touches nothing in the group.
      console.log(
        `  NEEDS MANUAL REVIEW — ${withSignal.length} accounts have real data: ${withSignal.map((u) => u._id.toString()).join(", ")}`,
      );
      totalNeedsReview += 1;
      continue;
    }

    // Zero or one account has real data. If zero, every account is empty — keep the oldest
    // (arbitrary but stable) so the group doesn't lose every representative for this device,
    // and delete the rest; if one, that one is untouched and every OTHER (empty) account is
    // safe to delete.
    let survivorId: string;
    if (withSignal.length === 1) {
      survivorId = withSignal[0]._id.toString();
    } else {
      const oldest = [...empties].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      survivorId = oldest._id.toString();
    }

    for (const empty of empties) {
      if (empty._id.toString() === survivorId) continue;
      console.log(`  Deleting empty duplicate ${empty._id.toString()} (created ${empty.createdAt.toISOString()})`);
      totalSafeDeletes += 1;
      if (apply) {
        await User.findByIdAndDelete(empty._id);
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Device groups with duplicates: ${duplicateGroups.length}`);
  console.log(`  Empty duplicates ${apply ? "deleted" : "safe to delete"}: ${totalSafeDeletes}`);
  console.log(`  Groups needing manual review (untouched): ${totalNeedsReview}`);
  if (!apply && totalSafeDeletes > 0) {
    console.log(`\nRun again with --apply to actually delete the ${totalSafeDeletes} safe duplicate(s).`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Cleanup script crashed:", error);
  process.exit(1);
});
