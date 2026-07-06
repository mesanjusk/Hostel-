import { z } from "zod";

export const documentItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  url: z.string().trim().url("Enter a valid URL"),
  category: z.string().trim().max(60).optional().or(z.literal("")),
});

export const documentItemUpdateSchema = documentItemSchema.partial().extend({
  id: z.string().min(1),
});

export type DocumentItemInput = z.infer<typeof documentItemSchema>;
export type DocumentItemUpdateInput = z.infer<typeof documentItemUpdateSchema>;
