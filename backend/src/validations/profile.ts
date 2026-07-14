import { z } from "zod";

import { collegeCategorySchema, genderSchema } from "@/validations/auth";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  gender: genderSchema,
  college: z.string().trim().min(1, "Enter your college name").max(120),
  collegeCategory: collegeCategorySchema,
});

export const notificationSettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
