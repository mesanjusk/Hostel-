import { connectDB } from "@/db";
import { User } from "@/models/User";
import { ChecklistItem } from "@/models/ChecklistItem";
import { Category } from "@/models/Category";
import { BudgetEntry } from "@/models/BudgetEntry";
import { Note } from "@/models/Note";
import { DocumentItem } from "@/models/DocumentItem";
import { EmergencyContact } from "@/models/EmergencyContact";
import { WishlistItem } from "@/models/WishlistItem";
import { generatePin, hashPin } from "@/lib/pin";
import type { OnboardingInput } from "@/validations/auth";
import type { ProfileUpdateInput } from "@/validations/profile";
import type { UserRole } from "@/types";

export async function getUserByMobile(mobile: string) {
  await connectDB();
  return User.findOne({ mobile }).lean();
}

export async function getUserById(id: string) {
  await connectDB();
  return User.findById(id).lean();
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  await connectDB();
  return User.findByIdAndUpdate(
    userId,
    {
      name: input.name,
      college: input.college || null,
      hostel: input.hostel || null,
      roomNumber: input.roomNumber || null,
    },
    { returnDocument: "after" },
  ).lean();
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  await connectDB();
  return User.findByIdAndUpdate(
    userId,
    {
      name: input.name,
      college: input.college || null,
      hostel: input.hostel || null,
      roomNumber: input.roomNumber || null,
      ...(input.avatar ? { avatar: input.avatar } : {}),
    },
    { returnDocument: "after" },
  ).lean();
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

export async function countActiveUsers(sinceDays: number) {
  await connectDB();
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  return User.countDocuments({ updatedAt: { $gte: since } });
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

  const user = await User.create({ mobile, role: "student", loginPinHash });
  return { success: true as const, user, pin };
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
  input: { mobile?: string; role?: UserRole },
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
    Category.deleteMany({ userId }),
    BudgetEntry.deleteMany({ userId }),
    Note.deleteMany({ userId }),
    DocumentItem.deleteMany({ userId }),
    EmergencyContact.deleteMany({ userId }),
    WishlistItem.deleteMany({ userId }),
  ]);

  await User.findByIdAndDelete(userId);

  return { success: true as const };
}
