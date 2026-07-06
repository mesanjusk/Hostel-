import { connectDB } from "@/db";
import { EmergencyContact } from "@/models/EmergencyContact";
import type { EmergencyContactInput, EmergencyContactUpdateInput } from "@/validations/contact";

export async function listContacts(userId: string) {
  await connectDB();
  return EmergencyContact.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function createContact(userId: string, input: EmergencyContactInput) {
  await connectDB();
  return EmergencyContact.create({ userId, ...input });
}

export async function updateContact(userId: string, input: EmergencyContactUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return EmergencyContact.findOneAndUpdate({ _id: id, userId }, rest, { returnDocument: "after" }).lean();
}

export async function deleteContact(userId: string, id: string) {
  await connectDB();
  return EmergencyContact.deleteOne({ _id: id, userId });
}
