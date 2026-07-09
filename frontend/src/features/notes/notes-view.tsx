import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pin, PinOff, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { NoteFormDialog } from "@/features/notes/note-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh, subscribeRefresh } from "@/lib/refresh-bus";
import { toNoteDTO, type NoteDTO, type NoteRaw } from "@/features/notes/note-dto";

export function NotesView() {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const { notes: raw } = await api.get<{ notes: NoteRaw[] }>("/api/notes");
      setNotes(raw.map(toNoteDTO).sort((a, b) => Number(b.pinned) - Number(a.pinned)));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  async function togglePin(note: NoteDTO) {
    setNotes((prev) =>
      prev
        .map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    );
    try {
      await api.patch(`/api/notes/${note.id}`, { pinned: !note.pinned });
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update note");
      fetchData();
    }
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/api/notes/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete note");
      fetchData();
    }
  }

  return (
    <div>
      <PageHeader title="Notes" description="Quick things worth remembering" />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Tap the + button below to jot down Wi-Fi passwords, roommate numbers, or anything else you don't want to forget."
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
                      aria-label={note.pinned ? "Unpin note" : "Pin note"}
                      onClick={() => togglePin(note)}
                    >
                      {note.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                    </Button>
                    <NoteFormDialog
                      note={note}
                      trigger={
                        <Button variant="ghost" size="icon" className="size-7" aria-label="Edit note">
                          <StickyNote className="size-3.5" />
                        </Button>
                      }
                    />
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="size-7" aria-label="Delete note">
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
