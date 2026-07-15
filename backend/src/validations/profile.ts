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

export const notificationSettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
