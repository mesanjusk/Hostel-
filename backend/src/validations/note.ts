import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  content: z.string().trim().max(8000).optional().or(z.literal("")),
  pinned: z.boolean(),
});

export const noteUpdateSchema = noteSchema.partial().extend({
  id: z.string().min(1),
});

export type NoteInput = z.infer<typeof noteSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
