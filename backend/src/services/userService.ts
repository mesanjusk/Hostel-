import { connectDB } from "@/db";
import { User } from "@/models/User";
import { ChecklistItem } from "@/models/ChecklistItem";
import { UserChecklist } from "@/models/UserChecklist";
import { Category } from "@/models/Category";
import { BudgetEntry } from "@/models/BudgetEntry";
import { Note } from "@/models/Note";
import { DocumentItem } from "@/models/DocumentItem";
import { EmergencyContact } from "@/models/EmergencyContact";
import { WishlistItem } from "@/models/WishlistItem";
import { CollegeCategory } from "@/models/CollegeCategory";
import { CommunityMember } from "@/models/CommunityMember";
import { TravelProfile } from "@/models/TravelProfile";
import { syncTravelProfileFromAccount } from "@/services/travelProfileService";
import { Connection } from "@/models/Connection";
import { generatePin, hashPin } from "@/lib/pin";
import { generateUniqueUsername } from "@/lib/username";
import { ensureAutoJoinCommunities } from "@/services/communityService";
import { ensurePlacesForCity } from "@/services/placeAutoFetchService";
import { ensureCollegeExists } from "@/services/collegeVerificationService";
import type { OnboardingInput } from "@/validations/auth";
import type { ProfileUpdateInput, ProfileQuickUpdateInput } from "@/validations/profile";
import { LEGACY_COLLEGE_CATEGORY_MAP, type UserRole } from "@/types";

export async function getUserByMobile(mobile: string) {
  await connectDB();
  return User.findOne({ mobile }).lean();
}

export async function getUserById(id: string) {
  await connectDB();
  return User.findById(id).lean();
}

/** Best-effort mapping of a DB-driven CollegeCategory to the legacy fixed enum, so old code
 * paths (categoryService's Designing-only folder, admin filters) keep working for new signups
 * too. Falls back to "Other", mirroring the legacy semantics. */
async function resolveLegacyCollegeCategory(collegeCategoryId: string) {
  const category = await CollegeCategory.findById(collegeCategoryId).select("slug name").lean();
  if (!category) return null;
  return LEGACY_COLLEGE_CATEGORY_MAP[category.slug] ?? LEGACY_COLLEGE_CATEGORY_MAP[category.name.toLowerCase()] ?? "Other";
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  await connectDB();
  const updated = await User.findByIdAndUpdate(
    userId,
    {
      name: input.name,
      gender: input.gender,
      ...(input.avatar ? { avatar: input.avatar } : {}),
    },
    { returnDocument: "after" },
  ).lean();

  // College/city aren't collected here anymore (see completeCommunityProfileSetup) — this
  // only picks up the global Country community until then.
  if (updated) await ensureAutoJoinCommunities(updated);
  return updated;
}

/** One-time "create your community profile" prompt, shown on first visit to Community: sets
 * the username (which doubles as the community display name — see User model's pre-save hook)
 * and, since onboarding no longer collects them, the college/city details too — this is the
 * first point those are actually known. Caller (users.routes.ts) has already checked the
 * username isn't taken, but this still goes through `findByIdAndUpdate` rather than
 * `.save()`, which would otherwise skip that pre-save hook — so `displayName` is set alongside
 * `username` explicitly here rather than relying on it. */
export async function completeCommunityProfileSetup(
  userId: string,
  input: {
    username: string;
    college: string;
    collegeCategoryId: string;
    city: string;
  },
) {
  await connectDB();
  const collegeCategory = await resolveLegacyCollegeCategory(input.collegeCategoryId);

  const updated = await User.findByIdAndUpdate(
    userId,
    {
      username: input.username,
      displayName: input.username,
      communityProfileConfigured: true,
      college: input.college,
      collegeCategoryId: input.collegeCategoryId,
      city: input.city,
      collegeCategory,
    },
    { returnDocument: "after" },
  ).lean();
  if (!updated) return null;

  // City/college are now known for the first time — this is when auto-join into the
  // Country/City/College/Marketplace/Events communities actually has data to work with.
  await ensureAutoJoinCommunities(updated);
  ensurePlacesForCity(updated.city);
  // First time this student's college is ever set — no "did it change" check needed the way
  // updateProfile below needs one, since this setup flow only ever runs once per student.
  ensureCollegeExists(updated.city, updated.collegeCategoryId?.toString() ?? null, updated.college);
  await syncTravelProfileFromAccount(updated._id.toString(), {
    city: updated.city,
    college: updated.college,
    homeTown: updated.homeTown,
  });
  return updated;
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  await connectDB();
  const collegeCategory = await resolveLegacyCollegeCategory(input.collegeCategoryId);
  // Captured before the write so ensureCollegeExists below only fires when college actually
  // changed — otherwise an unrelated edit (gender, city, ...) that leaves college untouched
  // would re-trigger a Wikipedia lookup for a name that's either already catalogued or was
  // already checked once and found unverifiable.
  const previousCollege = (await User.findById(userId).select("college").lean())?.college ?? null;
  // No backfill needed on a gender/category change: the checklist is always computed live from
  // the student's current profile fields, so the next read already reflects it.
  const updated = await User.findByIdAndUpdate(
    userId,
    {
      name: input.name,
      gender: input.gender,
      college: input.college,
      collegeCategoryId: input.collegeCategoryId,
      courseId: input.courseId || null,
      city: input.city,
      homeTown: input.homeTown || null,
      collegeCategory,
    },
    { returnDocument: "after" },
  ).lean();

  // Re-running auto-join is additive (see ensureAutoJoinCommunities) — a city/course/campus
  // change just adds the newly-implied communities without touching ones already joined.
  if (updated) {
    await ensureAutoJoinCommunities(updated);
    ensurePlacesForCity(updated.city);
    if (updated.college !== previousCollege) {
      ensureCollegeExists(updated.city, updated.collegeCategoryId?.toString() ?? null, updated.college);
    }
    // Keeps Roommate/Co-Packer matching (destinationCity + college) from running against a
    // stale travel profile the student saved before this edit — see
    // syncTravelProfileFromAccount's own comment for why the account profile has to win.
    await syncTravelProfileFromAccount(updated._id.toString(), {
      city: updated.city,
      college: updated.college,
      homeTown: updated.homeTown,
    });
  }
  return updated;
}

/** Progressive-profiling counterpart to updateProfile above: applies only whichever fields the
 * caller actually provided (Explore only ever sends `city`; Know Your Campus sends
 * `city`+`collegeCategoryId`+`college`), leaving every other field exactly as it was — unlike
 * updateProfile, which is fed a complete form and treats an absent optional field as "clear it".
 * Runs the same downstream side effects as updateProfile, but only the ones relevant to
 * whatever actually changed. */
export async function updateProfileFieldsPartial(userId: string, fields: ProfileQuickUpdateInput) {
  await connectDB();

  const set: Record<string, unknown> = {};
  if (fields.name !== undefined) set.name = fields.name;
  if (fields.gender !== undefined) set.gender = fields.gender;
  if (fields.city !== undefined) set.city = fields.city;
  if (fields.college !== undefined) set.college = fields.college;
  if (fields.homeTown !== undefined) set.homeTown = fields.homeTown || null;
  if (fields.courseId !== undefined) set.courseId = fields.courseId || null;
  if (fields.collegeCategoryId !== undefined) {
    set.collegeCategoryId = fields.collegeCategoryId;
    set.collegeCategory = await resolveLegacyCollegeCategory(fields.collegeCategoryId);
  }

  const updated = await User.findByIdAndUpdate(userId, set, { returnDocument: "after" }).lean();
  if (!updated) return null;

  if (fields.city !== undefined) ensurePlacesForCity(updated.city);
  if (fields.college !== undefined) {
    ensureCollegeExists(updated.city, updated.collegeCategoryId?.toString() ?? null, updated.college);
  }
  if (fields.city !== undefined || fields.college !== undefined) {
    await ensureAutoJoinCommunities(updated);
    await syncTravelProfileFromAccount(updated._id.toString(), {
      city: updated.city,
      college: updated.college,
      homeTown: updated.homeTown,
    });
  }

  return updated;
}

export async function setNotificationPreference(userId: string, enabled: boolean) {
  await connectDB();
  return User.findByIdAndUpdate(userId, { notificationsEnabled: enabled }, { returnDocument: "after" }).lean();
}

export async function listUsers(page: number, pageSize: number) {
  await connectDB();
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    User.countDocuments(),
  ]);
  return { users, total };
}

// Admin-dashboard-only (the sole caller is analyticsService.getAdminAnalytics) — safe to
// prefer a secondary rather than compete with operational writes for this read.
export async function countActiveUsers(sinceDays: number) {
  await connectDB();
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  return User.countDocuments({ updatedAt: { $gte: since } }).read("secondaryPreferred");
}

/** Admin-provisioned account: creates the user with a fresh PIN and returns the plaintext
 * code once — it is never stored or retrievable again, only regenerated. */
export async function createUserByAdmin(mobile: string) {
  await connectDB();

  const existing = await User.findOne({ mobile }).lean();
  if (existing) {
    return { success: false as const, error: "A user with this mobile number already exists" };
  }

  const pin = generatePin();
  const loginPinHash = await hashPin(pin);
  const username = await generateUniqueUsername();

  const user = await User.create({
    mobile,
    role: "student",
    loginPinHash,
    username,
    displayName: username,
    registeredAt: new Date(),
  });
  return { success: true as const, user, pin };
}

/** Self-service registration once the mobile's OTP has been verified by the caller. Defaults
 * to the verified OTP code itself as the account's login code, but the caller can pass a
 * `customPin` (from the "set your login code" field on the verify step) to use instead. */
export async function registerUserWithOtp(mobile: string, verifiedOtpCode: string, customPin?: string) {
  await connectDB();

  const existing = await User.findOne({ mobile }).lean();
  if (existing) {
    return { success: false as const, error: "An account with this mobile number already exists" };
  }

  const loginPinHash = await hashPin(customPin ?? verifiedOtpCode);
  const username = await generateUniqueUsername();
  const user = await User.create({
    mobile,
    role: "student",
    loginPinHash,
    username,
    displayName: username,
    registeredAt: new Date(),
  });
  return { success: true as const, user };
}

/** Passwordless sign-in/up (MSG91 OTP flow): returns the account for an already-verified
 * mobile, creating a brand-new student account on first sign-in. No login PIN is set — with
 * MSG91 the number itself is the credential (re-verified via OTP on every login), so these
 * accounts authenticate purely by widget-verified mobile. A fresh account has no `name`, so
 * serializeUser reports `needsOnboarding: true` and the app routes it to onboarding. */
export async function getOrCreateUserByMobile(mobile: string, deviceId?: string | null) {
  await connectDB();

  const existing = await User.findOne({ mobile });
  if (existing) return existing;

  const username = await generateUniqueUsername();
  return User.create({
    mobile,
    role: "student",
    username,
    displayName: username,
    registeredAt: new Date(),
    deviceId: deviceId ?? null,
  });
}

/** Creates the account behind a brand-new, never-seen-before browser — called the moment
 * anyone lands on the site (see POST /api/auth/anonymous), before they've provided a mobile
 * number or even opened the app before. No `mobile` is set at all (not even `null` — see the
 * User model's comment on that field), so this never collides with the sparse unique index
 * no matter how many anonymous visitors exist. Gets a normal JWT just like any other account,
 * which is what lets every existing feature (checklist, budget, notes, ...) work unchanged for
 * an unidentified visitor — they're a real User document from their very first page load. */
export async function createAnonymousUser(deviceId?: string | null) {
  await connectDB();

  const username = await generateUniqueUsername();
  return User.create({ role: "student", username, displayName: username, deviceId: deviceId ?? null });
}

/** Attaches a freshly OTP-verified mobile number to an already-existing account in place —
 * used when the account making the request is still anonymous (see auth.routes.ts's
 * otp/widget-verify): the visitor's existing checklist/budget/notes/etc. stay exactly where
 * they are, keyed to the same `_id`, and this is the first time that document becomes
 * identifiable. Distinct from getOrCreateUserByMobile, which always resolves (or creates) the
 * account for a mobile number rather than a specific already-known document. Throws on a
 * duplicate-key race (mobile claimed by someone else a moment earlier) — the caller falls back
 * to a normal login for that mobile instead. */
export async function linkMobileToUser(userId: string, mobile: string) {
  await connectDB();
  return User.findByIdAndUpdate(userId, { mobile, registeredAt: new Date() }, { returnDocument: "after" });
}

/** Sets (or changes) an authenticated visitor's gender — the one field the Home-page gender
 * popup needs to write, for both anonymous and fully-identified accounts. Deliberately its own
 * narrow endpoint/service function rather than routed through updateProfile, which requires a
 * full profile edit's worth of fields (college/city/etc.) that an anonymous visitor picking a
 * theme on their first visit hasn't provided yet. */
export async function setUserGender(userId: string, gender: string) {
  await connectDB();
  return User.findByIdAndUpdate(userId, { gender }, { returnDocument: "after" });
}

/** Sets a new login code for an existing account once the mobile's OTP has been verified.
 * Defaults to the verified OTP code itself, or uses the caller-supplied `customPin` instead.
 * Bumps tokenVersion so any JWT issued before this reset stops being accepted immediately —
 * otherwise a token that leaked before the reset would remain valid for its full 30-day TTL. */
export async function resetPinWithOtp(mobile: string, verifiedOtpCode: string, customPin?: string) {
  await connectDB();

  const loginPinHash = await hashPin(customPin ?? verifiedOtpCode);
  const user = await User.findOneAndUpdate(
    { mobile },
    { loginPinHash, $inc: { tokenVersion: 1 } },
    { returnDocument: "after" },
  );
  if (!user) {
    return { success: false as const, error: "No account found with this mobile number" };
  }

  return { success: true as const, user };
}

/** Same tokenVersion-bump reasoning as resetPinWithOtp — an admin regenerating a user's code
 * is exactly the moment any of that user's existing sessions should stop being trusted. */
export async function regeneratePin(userId: string) {
  await connectDB();

  const pin = generatePin();
  const loginPinHash = await hashPin(pin);

  const user = await User.findByIdAndUpdate(
    userId,
    { loginPinHash, $inc: { tokenVersion: 1 } },
    { returnDocument: "after" },
  ).lean();
  if (!user) {
    return { success: false as const, error: "User not found" };
  }

  return { success: true as const, pin };
}

export async function adminUpdateUser(
  userId: string,
  input: { mobile?: string; role?: UserRole; verified?: boolean },
) {
  await connectDB();

  if (input.mobile) {
    const clash = await User.findOne({ mobile: input.mobile, _id: { $ne: userId } }).lean();
    if (clash) {
      return { success: false as const, error: "A user with this mobile number already exists" };
    }
  }

  await User.findByIdAndUpdate(userId, {
    ...(input.mobile ? { mobile: input.mobile } : {}),
    ...(input.role ? { role: input.role } : {}),
    ...(input.verified !== undefined ? { verified: input.verified } : {}),
  });

  return { success: true as const };
}

/** Deletes the user and everything keyed to their account. Callers must ensure an admin
 * can't delete their own account (checked at the call site, where the session is available). */
export async function deleteUserByAdmin(userId: string) {
  await connectDB();

  const user = await User.findById(userId).lean();
  if (!user) {
    return { success: false as const, error: "User not found" };
  }

  await Promise.all([
    ChecklistItem.deleteMany({ userId }),
    UserChecklist.deleteMany({ userId }),
    Category.deleteMany({ userId }),
    BudgetEntry.deleteMany({ userId }),
    Note.deleteMany({ userId }),
    DocumentItem.deleteMany({ userId }),
    EmergencyContact.deleteMany({ userId }),
    WishlistItem.deleteMany({ userId }),
    CommunityMember.deleteMany({ userId }),
    // Discovery data: left behind, these orphaned documents still match other users' queries
    // (destination-city / roommate search) and crash on the deleted user's populated fields.
    TravelProfile.deleteMany({ userId }),
    Connection.deleteMany({ $or: [{ requesterId: userId }, { recipientId: userId }] }),
  ]);

  await User.findByIdAndDelete(userId);

  return { success: true as const };
}
