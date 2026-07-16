import { z } from "zod";

import { CHECKLIST_GENDER_OPTIONS, CHECKLIST_PRIORITIES, PLAN_TYPES, STORE_OPTIONS } from "@/types";

const objectIdSchema = z.string().trim().regex(/^[a-f0-9]{24}$/i, "Invalid id");

export const collegeCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  icon: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().optional(),
});

export const collegeCategoryUpdateSchema = collegeCategorySchema.partial().extend({
  id: objectIdSchema,
  active: z.boolean().optional(),
});

export const courseSchema = z.object({
  collegeCategoryId: objectIdSchema,
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().optional(),
});

export const courseUpdateSchema = courseSchema.partial().extend({
  id: objectIdSchema,
  active: z.boolean().optional(),
});

export const checklistTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const checklistTemplateUpdateSchema = z.object({
  id: objectIdSchema,
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  published: z.boolean().optional(),
  active: z.boolean().optional(),
});

const defaultChecklistItemBaseSchema = z.object({
  category: z.string().trim().min(1, "Category is required").max(60),
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  image: z.string().trim().max(200_000).optional().or(z.literal("")),
  priority: z.enum(CHECKLIST_PRIORITIES).optional(),
  planType: z.enum(PLAN_TYPES).nullable().optional(),
  importance: z.string().trim().max(200).optional().or(z.literal("")),
  estimatedPrice: z.coerce.number().min(0).optional().nullable(),
  recommendedBrand: z.string().trim().max(80).optional().or(z.literal("")),
  recommendedStore: z.enum(STORE_OPTIONS).optional().nullable(),
  purchaseLink: z.string().trim().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().optional(),
  gender: z.enum(CHECKLIST_GENDER_OPTIONS).optional(),
  applicableCollegeCategories: z.array(objectIdSchema).optional(),
  applicableCourses: z.array(objectIdSchema).optional(),
  isForAllCollegeCategories: z.boolean().optional(),
  isForAllCourses: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const defaultChecklistItemSchema = defaultChecklistItemBaseSchema;

export const defaultChecklistItemUpdateSchema = defaultChecklistItemBaseSchema.partial().extend({
  id: objectIdSchema,
});

export const bulkImportDefaultItemsSchema = z.object({
  rows: z
    .array(
      z.object({
        category: z.string().trim().min(1).max(60),
        title: z.string().trim().min(1).max(120),
        description: z.string().trim().max(500).optional(),
        priority: z.enum(CHECKLIST_PRIORITIES).optional(),
        estimatedPrice: z.coerce.number().min(0).optional(),
        gender: z.enum(CHECKLIST_GENDER_OPTIONS).optional(),
        collegeCategoryNames: z.array(z.string().trim().min(1)).optional(),
      }),
    )
    .min(1)
    .max(1000),
});

export const bulkIdsSchema = z.object({
  ids: z.array(objectIdSchema).min(1),
});

export const bulkSetActiveSchema = bulkIdsSchema.extend({
  active: z.boolean(),
});

export const addSuggestedToDefaultSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(60),
  description: z.string().trim().max(500).optional(),
  priority: z.enum(CHECKLIST_PRIORITIES).optional(),
  applicableCollegeCategories: z.array(objectIdSchema).optional(),
  applicableCourses: z.array(objectIdSchema).optional(),
  isForAllCollegeCategories: z.boolean().optional(),
  isForAllCourses: z.boolean().optional(),
});

export type CollegeCategoryInput = z.infer<typeof collegeCategorySchema>;
export type CollegeCategoryUpdateInput = z.infer<typeof collegeCategoryUpdateSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type ChecklistTemplateInput = z.infer<typeof checklistTemplateSchema>;
export type ChecklistTemplateUpdateInput = z.infer<typeof checklistTemplateUpdateSchema>;
export type DefaultChecklistItemFormInput = z.infer<typeof defaultChecklistItemSchema>;
export type DefaultChecklistItemUpdateInput = z.infer<typeof defaultChecklistItemUpdateSchema>;
export type BulkImportDefaultItemsInput = z.infer<typeof bulkImportDefaultItemsSchema>;
export type BulkIdsInput = z.infer<typeof bulkIdsSchema>;
export type BulkSetActiveInput = z.infer<typeof bulkSetActiveSchema>;
export type AddSuggestedToDefaultInput = z.infer<typeof addSuggestedToDefaultSchema>;
