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
import { generatePin, hashPin } from "@/lib/pin";
import { generateUniqueUsername } from "@/lib/username";
import { ensureAutoJoinCommunities } from "@/services/communityService";
import type { OnboardingInput } from "@/validations/auth";
import type { ProfileUpdateInput } from "@/validations/profile";
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
  const collegeCategory = await resolveLegacyCollegeCategory(input.collegeCategoryId);
  const updated = await User.findByIdAndUpdate(
    userId,
    {
      name: input.name,
      gender: input.gender,
      college: input.college,
      collegeCategoryId: input.collegeCategoryId,
      city: input.city,
      collegeCategory,
    },
    { returnDocument: "after" },
  ).lean();

  // City/college are now known for the first time — this is when auto-join into the
  // Country/City/College/Marketplace/Events communities actually has data to work with.
  if (updated) await ensureAutoJoinCommunities(updated);
  return updated;
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  await connectDB();
  const collegeCategory = await resolveLegacyCollegeCategory(input.collegeCategoryId);
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
  if (updated) await ensureAutoJoinCommunities(updated);
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

  const user = await User.create({ mobile, role: "student", loginPinHash, username, displayName: username });
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
  const user = await User.create({ mobile, role: "student", loginPinHash, username, displayName: username });
  return { success: true as const, user };
}

/** Sets a new login code for an existing account once the mobile's OTP has been verified.
 * Defaults to the verified OTP code itself, or uses the caller-supplied `customPin` instead. */
export async function resetPinWithOtp(mobile: string, verifiedOtpCode: string, customPin?: string) {
  await connectDB();

  const loginPinHash = await hashPin(customPin ?? verifiedOtpCode);
  const user = await User.findOneAndUpdate({ mobile }, { loginPinHash }, { returnDocument: "after" });
  if (!user) {
    return { success: false as const, error: "No account found with this mobile number" };
  }

  return { success: true as const, user };
}

export async function regeneratePin(userId: string) {
  await connectDB();

  const pin = generatePin();
  const loginPinHash = await hashPin(pin);

  const user = await User.findByIdAndUpdate(userId, { loginPinHash }, { returnDocument: "after" }).lean();
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
  ]);

  await User.findByIdAndDelete(userId);

  return { success: true as const };
}
