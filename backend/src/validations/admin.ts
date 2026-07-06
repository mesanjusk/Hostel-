import { z } from "zod";

import { DEFAULT_CHECKLIST_CATEGORIES, GUIDE_CATEGORIES } from "@/types";
import { mobileSchema } from "@/validations/auth";

export const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  category: z.enum(DEFAULT_CHECKLIST_CATEGORIES),
  store: z.string().trim().min(1).max(80),
  price: z.coerce.number().min(0),
  discountPercent: z.coerce.number().min(0).max(100),
  rating: z.coerce.number().min(0).max(5),
  pros: z.array(z.string().trim().min(1)),
  cons: z.array(z.string().trim().min(1)),
  buyLinks: z.object({
    amazon: z.string().trim().url().optional().or(z.literal("")),
    flipkart: z.string().trim().url().optional().or(z.literal("")),
    myntra: z.string().trim().url().optional().or(z.literal("")),
    decathlon: z.string().trim().url().optional().or(z.literal("")),
    local: z.string().trim().url().optional().or(z.literal("")),
  }),
  budgetAlternative: z.string().optional().nullable(),
  premiumAlternative: z.string().optional().nullable(),
  featured: z.boolean(),
});

export const productUpdateSchema = productSchema.partial().extend({
  id: z.string().min(1),
});

export const guideArticleSchema = z.object({
  title: z.string().trim().min(1).max(150),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  category: z.enum(GUIDE_CATEGORIES),
  icon: z.string().trim().max(60),
  summary: z.string().trim().max(300).optional().or(z.literal("")),
  content: z.string().trim().min(1),
  order: z.coerce.number(),
});

export const guideArticleUpdateSchema = guideArticleSchema.partial().extend({
  id: z.string().min(1),
});

export const createUserByAdminSchema = z.object({
  mobile: mobileSchema,
});

export const updateUserByAdminSchema = z.object({
  mobile: mobileSchema.optional(),
  role: z.enum(["student", "admin"]).optional(),
});

export const uiLayoutSchema = z.object({
  widgets: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        visible: z.boolean(),
      }),
    )
    .min(1),
});

const elementLayoutOverrideSchema = z.object({
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
  scale: z.number().min(0.2).max(4).optional(),
  rotation: z.number().min(-180).max(180).optional(),
  visible: z.boolean().optional(),
});

export const landingDesignSchema = z.object({
  elements: z.array(
    z.object({
      id: z.string().trim().min(1),
      lines: z.array(z.string()).optional(),
      ctaLabel: z.string().optional(),
      layouts: z
        .object({
          mobile: elementLayoutOverrideSchema.optional(),
          desktop: elementLayoutOverrideSchema.optional(),
        })
        .optional(),
    }),
  ),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type GuideArticleInput = z.infer<typeof guideArticleSchema>;
export type GuideArticleUpdateInput = z.infer<typeof guideArticleUpdateSchema>;
export type CreateUserByAdminInput = z.infer<typeof createUserByAdminSchema>;
export type UpdateUserByAdminInput = z.infer<typeof updateUserByAdminSchema>;
export type UiLayoutInput = z.infer<typeof uiLayoutSchema>;
export type LandingDesignInput = z.infer<typeof landingDesignSchema>;
