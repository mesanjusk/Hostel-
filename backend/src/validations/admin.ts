import { z } from "zod";

import { DEFAULT_CHECKLIST_CATEGORIES, GUIDE_CATEGORIES, PLACE_CATEGORIES } from "@/types";
import { mobileSchema } from "@/validations/auth";

export const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
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

// Admin "bulk add" (CSV import) — same shape as a single product, just many at once.
export const bulkImportProductsSchema = z.object({
  products: z.array(productSchema).min(1).max(500),
});
export type BulkImportProductsInput = z.infer<typeof bulkImportProductsSchema>;

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
  verified: z.boolean().optional(),
});

export const uiLayoutSchema = z.object({
  widgets: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        visible: z.boolean(),
        // Nav-layout-only fields — dashboard/home-card layouts never send these, so they're
        // optional here rather than splitting into a separate schema per page.
        placement: z.enum(["bottom", "overflow"]).optional(),
        order: z.number().int().min(0).optional(),
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
  zIndex: z.number().int().min(-1000).max(1000).optional(),
});

export const landingDesignSchema = z.object({
  page: z.enum(["home", "survival-guide"]).optional().default("home"),
  elements: z.array(
    z.object({
      id: z.string().trim().min(1),
      section: z.number().int().min(0).max(20).optional(),
      kind: z.enum(["image", "card"]).optional(),
      // Uploaded images are stored inline as base64 data URIs — cap comfortably above the
      // frontend's 2MB file-size limit to account for base64's ~33% size inflation.
      src: z.string().max(3_000_000).optional(),
      alt: z.string().max(200).optional(),
      emoji: z.string().max(20).optional(),
      lines: z.array(z.string()).optional(),
      ctaLabel: z.string().optional(),
      href: z.string().max(300).optional(),
      background: z.string().trim().max(50).optional(),
      shape: z.string().trim().max(30).optional(),
      textStyle: z.string().trim().max(30).optional(),
      textColor: z.string().trim().max(50).optional(),
      fontSize: z.enum(["sm", "md", "lg", "xl"]).optional(),
      bold: z.boolean().optional(),
      isCustom: z.boolean().optional(),
      layouts: z
        .object({
          mobile: elementLayoutOverrideSchema.optional(),
          desktop: elementLayoutOverrideSchema.optional(),
        })
        .optional(),
    }),
  ),
  sectionBackgrounds: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        background: z.string().trim().min(1).max(500),
      }),
    )
    .optional(),
});

export const citySchema = z.object({
  name: z.string().trim().min(1).max(80),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  featured: z.boolean().optional(),
});

export const cityUpdateSchema = citySchema.partial().extend({
  id: z.string().min(1),
});

export const placeSchema = z.object({
  city: z.string().trim().min(1).max(80),
  category: z.enum(PLACE_CATEGORIES),
  name: z.string().trim().min(1).max(150),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  mapsLink: z.string().trim().max(500).optional().or(z.literal("")),
  openingHours: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  featured: z.boolean().optional(),
});

export const placeUpdateSchema = placeSchema.partial().extend({
  id: z.string().min(1),
});

// Accepts a 3- or 6-digit hex color, or "" to clear an override back to the frontend's
// hardcoded default for that field (see gender-theme-view.tsx / gender-theme-settings.ts).
const hexColorOrEmpty = z
  .string()
  .trim()
  .regex(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))?$/, "Must be a hex color like #1e3a5f, or blank");

export const genderThemeUpdateSchema = z.object({
  primaryColor: hexColorOrEmpty,
  secondaryColor: hexColorOrEmpty,
  accentColor: hexColorOrEmpty,
  gradientFrom: hexColorOrEmpty,
  gradientTo: hexColorOrEmpty,
  stickerSlugs: z.array(z.string().trim().min(1).max(60)).max(200),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type GuideArticleInput = z.infer<typeof guideArticleSchema>;
export type GuideArticleUpdateInput = z.infer<typeof guideArticleUpdateSchema>;
export type CreateUserByAdminInput = z.infer<typeof createUserByAdminSchema>;
export type UpdateUserByAdminInput = z.infer<typeof updateUserByAdminSchema>;
export type UiLayoutInput = z.infer<typeof uiLayoutSchema>;
export type LandingDesignInput = z.infer<typeof landingDesignSchema>;
export type CityInput = z.infer<typeof citySchema>;
export type CityUpdateInput = z.infer<typeof cityUpdateSchema>;
export type PlaceInput = z.infer<typeof placeSchema>;
export type PlaceUpdateInput = z.infer<typeof placeUpdateSchema>;
export type GenderThemeUpdateInput = z.infer<typeof genderThemeUpdateSchema>;
