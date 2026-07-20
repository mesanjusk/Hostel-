import { z } from "zod";

import { citySchema, collegeCategoryIdSchema, courseIdSchema, genderSchema } from "@/validations/auth";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  gender: genderSchema,
  college: z.string().trim().min(1, "Enter your college name").max(120),
  collegeCategoryId: collegeCategoryIdSchema,
  // Voluntary — not collected at registration, so profile saves can't require it.
  courseId: courseIdSchema.optional().or(z.literal("")),
  city: citySchema,
  // Voluntary — added later from the profile page.
  homeTown: z.string().trim().max(80).optional().or(z.literal("")),
});

// Progressive profiling: Explore/Know Your Campus prompt for just the one or two fields they
// actually need (city; city+category+college), in place, instead of sending the visitor to the
// full profile-edit form. Every field optional — the route rejects an empty body itself.
export const profileQuickUpdateSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(80).optional(),
    gender: genderSchema.optional(),
    city: citySchema.optional(),
    college: z.string().trim().min(1, "Enter your college name").max(120).optional(),
    collegeCategoryId: collegeCategoryIdSchema.optional(),
    courseId: courseIdSchema.optional().or(z.literal("")),
    homeTown: z.string().trim().max(80).optional().or(z.literal("")),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Provide at least one field" });

export type ProfileQuickUpdateInput = z.infer<typeof profileQuickUpdateSchema>;

export const notificationSettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
});

export const whatsappBroadcastSettingsSchema = z.object({
  waBroadcastEnabled: z.boolean(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
