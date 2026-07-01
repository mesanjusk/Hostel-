import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { listNotes } from "@/services/noteService";
import { toPlain } from "@/lib/serialize";
import { NotesView } from "@/features/notes/notes-view";
import type { NoteDTO } from "@/types";

export const metadata: Metadata = { title: "Notes — Hostel Essentials" };

export default async function NotesPage() {
  const session = await auth();
  const notes = await listNotes(session!.user.id);

  const initialNotes: NoteDTO[] = toPlain(notes).map((n) => ({
    id: n._id,
    title: n.title,
    content: n.content,
    pinned: n.pinned,
    updatedAt: n.updatedAt,
  }));

  return <NotesView initialNotes={initialNotes} />;
}
