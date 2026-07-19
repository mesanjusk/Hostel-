import { connectDB } from "@/db";
import { TravelProfile } from "@/models/TravelProfile";
import type { TravelProfileInput } from "@/validations/discovery";

export async function getMyTravelProfile(userId: string) {
  await connectDB();
  return TravelProfile.findOne({ userId }).lean();
}

/** Creates or updates the caller's single discovery profile — Co-Packer and Roommate
 * discovery both read from this one document. */
export async function upsertMyTravelProfile(userId: string, input: TravelProfileInput) {
  await connectDB();
  return TravelProfile.findOneAndUpdate(
    { userId },
    { $set: { ...input, userId } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
}

export async function deleteMyTravelProfile(userId: string) {
  await connectDB();
  return TravelProfile.deleteOne({ userId });
}

/** Keeps an already-saved travel profile's destination city/college/hometown in step with the
 * account profile that owns them — those three are shown as read-only "frozen" fields on
 * TravelProfileForm precisely because the account profile (not the travel profile) is meant to be
 * their one source of truth. Without this, Roommate/Co-Packer matching (destinationCity + college
 * are match filters — see discoveryService.ts) would keep running against whatever city/college
 * the student had when they last opened "My Profile" under Find a Roomie/Discover and hit Save,
 * even after they've since changed it on the account Profile page.
 *
 * No-op (matches zero documents) for anyone who hasn't opted into discovery yet — there's no
 * travel profile to keep in sync until they create one themselves. */
export async function syncTravelProfileFromAccount(
  userId: string,
  fields: { city?: string | null; college?: string | null; homeTown?: string | null },
) {
  await connectDB();
  await TravelProfile.updateOne(
    { userId },
    { $set: { destinationCity: fields.city ?? "", college: fields.college ?? null, currentCity: fields.homeTown ?? null } },
  );
}
