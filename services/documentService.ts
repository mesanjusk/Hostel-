import "server-only";

import { connectDB } from "@/lib/db";
import { DocumentItem } from "@/models/DocumentItem";
import type { DocumentItemInput, DocumentItemUpdateInput } from "@/lib/validations/document";

export async function listDocuments(userId: string) {
  await connectDB();
  return DocumentItem.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function createDocument(userId: string, input: DocumentItemInput) {
  await connectDB();
  return DocumentItem.create({ userId, ...input });
}

export async function updateDocument(userId: string, input: DocumentItemUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return DocumentItem.findOneAndUpdate({ _id: id, userId }, rest, { new: true }).lean();
}

export async function deleteDocument(userId: string, id: string) {
  await connectDB();
  return DocumentItem.deleteOne({ _id: id, userId });
}
