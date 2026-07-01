import "server-only";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ChecklistItem } from "@/models/ChecklistItem";
import type { OnboardingInput } from "@/lib/validations/auth";
import type { ProfileUpdateInput } from "@/lib/validations/profile";
import type { BroadcastInput } from "@/lib/validations/admin";

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
    { new: true },
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
    { new: true },
  ).lean();
}

export async function setNotificationPreference(userId: string, enabled: boolean) {
  await connectDB();
  return User.findByIdAndUpdate(userId, { notificationsEnabled: enabled }, { new: true }).lean();
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

export async function listBroadcastRecipients(audience: BroadcastInput["audience"]) {
  await connectDB();

  if (audience === "incomplete-checklist") {
    const userIds = await ChecklistItem.distinct("userId", { completed: false });
    return User.find({ _id: { $in: userIds }, optedOutOfBroadcast: false })
      .select("mobile")
      .lean();
  }

  return User.find({ optedOutOfBroadcast: false }).select("mobile").lean();
}
