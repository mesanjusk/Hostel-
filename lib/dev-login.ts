import { timingSafeEqual } from "node:crypto";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { seedDefaultChecklistIfEmpty } from "@/services/checklistService";

const DEV_TEST_MOBILE = "910000000000";

/** Reserved, unroutable mobile number used only for the secret-gated dev test account. */
export function isDevLoginConfigured() {
  return Boolean(process.env.DEV_LOGIN_SECRET);
}

export function verifyDevLoginSecret(candidate: unknown): boolean {
  const expected = process.env.DEV_LOGIN_SECRET;
  if (!expected || typeof candidate !== "string" || candidate.length === 0) {
    return false;
  }

  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export async function getOrCreateDevTestUser() {
  await connectDB();

  const user = await User.findOneAndUpdate(
    { mobile: DEV_TEST_MOBILE },
    {
      $setOnInsert: {
        mobile: DEV_TEST_MOBILE,
        name: "Test Admin (Dev Login)",
      },
      $set: { role: "admin" },
    },
    { upsert: true, returnDocument: "after" },
  );

  await seedDefaultChecklistIfEmpty(user._id.toString());

  return user;
}
