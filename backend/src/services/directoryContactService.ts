import { connectDB } from "@/db";
import { DirectoryContact } from "@/models/DirectoryContact";
import { escapeRegex } from "@/lib/regex";
import type { ContactCategory } from "@/types";
import type { DirectoryContactInput } from "@/validations/directoryContacts";

export async function listDirectoryContacts(city: string, category?: ContactCategory, search?: string) {
  await connectDB();
  const filter: Record<string, unknown> = { city: new RegExp(`^${city}$`, "i") };
  if (category) filter.category = category;
  if (search) filter.name = new RegExp(escapeRegex(search), "i");

  return DirectoryContact.find(filter).sort({ verified: -1, createdAt: -1 }).lean();
}

export async function createDirectoryContact(userId: string, input: DirectoryContactInput) {
  await connectDB();
  return DirectoryContact.create({ ...input, addedByUserId: userId });
}

export async function reportDirectoryContact(userId: string, contactId: string, reason: string) {
  await connectDB();
  const contact = await DirectoryContact.findByIdAndUpdate(
    contactId,
    { $push: { reports: { userId, reason, createdAt: new Date() } } },
    { returnDocument: "after" },
  ).lean();
  if (!contact) return { success: false as const, error: "Contact not found" };
  return { success: true as const, contact };
}

export async function deleteOwnDirectoryContact(userId: string, contactId: string) {
  await connectDB();
  return DirectoryContact.deleteOne({ _id: contactId, addedByUserId: userId });
}

// --- Admin moderation ---

export async function listReportedContacts() {
  await connectDB();
  return DirectoryContact.find({ "reports.0": { $exists: true } })
    .sort({ updatedAt: -1 })
    .lean();
}

export async function verifyDirectoryContact(contactId: string, verified: boolean) {
  await connectDB();
  return DirectoryContact.findByIdAndUpdate(contactId, { verified }, { returnDocument: "after" }).lean();
}

export async function adminDeleteDirectoryContact(contactId: string) {
  await connectDB();
  return DirectoryContact.deleteOne({ _id: contactId });
}
