import { Router } from "express";

import { noteSchema, noteUpdateSchema } from "@/validations/note";
import { createNote, deleteNote, listNotes, updateNote } from "@/services/noteService";
import { requireAuth } from "@/middleware/auth";

export const notesRouter = Router();

notesRouter.use(requireAuth);

notesRouter.get("/", async (req, res) => {
  const notes = await listNotes(req.user!._id.toString());
  res.json({ notes });
});

notesRouter.post("/", async (req, res) => {
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const note = await createNote(req.user!._id.toString(), parsed.data);
  res.json({ note });
});

notesRouter.patch("/:id", async (req, res) => {
  const parsed = noteUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const note = await updateNote(req.user!._id.toString(), parsed.data);
  res.json({ note });
});

notesRouter.delete("/:id", async (req, res) => {
  await deleteNote(req.user!._id.toString(), req.params.id);
  res.json({ success: true });
});
