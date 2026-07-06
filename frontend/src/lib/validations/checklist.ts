import { z } from "zod";

import { CHECKLIST_PRIORITIES, STORE_OPTIONS } from "@/types";

const checklistCategoryField = z.string().trim().min(1, "Category is required").max(60);

export const checklistItemSchema = z.object({
  category: checklistCategoryField,
  item: z.string().trim().min(1, "Item name is required").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  priority: z.enum(CHECKLIST_PRIORITIES),
  price: z.coerce.number().min(0).optional().nullable(),
  priceRangeMin: z.coerce.number().min(0).optional().nullable(),
  priceRangeMax: z.coerce.number().min(0).optional().nullable(),
  recommendedBrand: z.string().trim().max(80).optional().or(z.literal("")),
  recommendedStore: z.enum(STORE_OPTIONS).optional().nullable(),
  purchaseLink: z.string().trim().url().optional().or(z.literal("")),
  studentRating: z.coerce.number().min(0).max(5).optional().nullable(),
  importance: z.string().trim().max(200).optional().or(z.literal("")),
});

export const checklistItemUpdateSchema = checklistItemSchema.partial().extend({
  id: z.string().min(1),
  completed: z.boolean().optional(),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(["complete", "incomplete", "delete", "duplicate"]),
});

export const bulkCreateItemsSchema = z.object({
  category: checklistCategoryField,
  priority: z.enum(CHECKLIST_PRIORITIES),
  names: z.array(z.string().trim().min(1).max(120)).min(1),
});

export const quickRenameItemSchema = z.object({
  id: z.string().min(1),
  item: z.string().trim().min(1, "Item name is required").max(120),
});

export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;
export type ChecklistItemUpdateInput = z.infer<typeof checklistItemUpdateSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type BulkCreateItemsInput = z.infer<typeof bulkCreateItemsSchema>;
export type QuickRenameItemInput = z.infer<typeof quickRenameItemSchema>;
