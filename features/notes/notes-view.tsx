"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pin, PinOff, Trash2, StickyNote } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { NoteFormDialog } from "@/features/notes/note-form-dialog";
import { deleteNoteAction, updateNoteAction } from "@/actions/notes";
import type { NoteDTO } from "@/types";

export function NotesView({ initialNotes }: { initialNotes: NoteDTO[] }) {
  const [notes, setNotes] = useState(initialNotes);

  async function togglePin(note: NoteDTO) {
    setNotes((prev) =>
      prev
        .map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    );
    await updateNoteAction({ id: note.id, pinned: !note.pinned });
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    const result = await deleteNoteAction(id);
    if (!result.success) toast.error(result.error);
  }

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Quick things worth remembering"
        action={<NoteFormDialog />}
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Jot down Wi-Fi passwords, roommate numbers, or anything else you don't want to forget."
          action={<NoteFormDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="h-full gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display line-clamp-1 font-semibold">{note.title}</h3>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => togglePin(note)}
                    >
                      {note.pinned ? (
                        <PinOff className="size-3.5" />
                      ) : (
                        <Pin className="size-3.5" />
                      )}
                    </Button>
                    <NoteFormDialog
                      note={note}
                      trigger={
                        <Button variant="ghost" size="icon" className="size-7">
                          <StickyNote className="size-3.5" />
                        </Button>
                      }
                    />
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="size-7">
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                      title="Delete this note?"
                      description="This can't be undone."
                      onConfirm={() => handleDelete(note.id)}
                    />
                  </div>
                </div>
                <p className="text-muted-foreground line-clamp-4 text-sm whitespace-pre-wrap">
                  {note.content}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
