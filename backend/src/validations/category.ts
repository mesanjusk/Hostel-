import { z } from "zod";

export const categoryNameSchema = z.string().trim().min(1, "Category name is required").max(60);

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  icon: z.string().trim().max(40).optional().nullable(),
});

export const renameCategorySchema = z.object({
  id: z.string().min(1),
  name: categoryNameSchema,
  icon: z.string().trim().max(40).optional().nullable(),
});

export const deleteCategorySchema = z.object({
  moveItemsTo: z.string().min(1).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type RenameCategoryInput = z.infer<typeof renameCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
