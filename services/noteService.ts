import "server-only";

import { connectDB } from "@/lib/db";
import { Note } from "@/models/Note";
import type { NoteInput, NoteUpdateInput } from "@/lib/validations/note";

export async function listNotes(userId: string) {
  await connectDB();
  return Note.find({ userId }).sort({ pinned: -1, updatedAt: -1 }).lean();
}

export async function createNote(userId: string, input: NoteInput) {
  await connectDB();
  return Note.create({ userId, ...input });
}

export async function updateNote(userId: string, input: NoteUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return Note.findOneAndUpdate({ _id: id, userId }, rest, { new: true }).lean();
}

export async function deleteNote(userId: string, id: string) {
  await connectDB();
  return Note.deleteOne({ _id: id, userId });
}
