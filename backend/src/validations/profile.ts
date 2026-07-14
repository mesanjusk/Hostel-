import { z } from "zod";

import { collegeCategoryIdSchema, courseIdSchema, genderSchema } from "@/validations/auth";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  gender: genderSchema,
  college: z.string().trim().min(1, "Enter your college name").max(120),
  collegeCategoryId: collegeCategoryIdSchema,
  courseId: courseIdSchema,
});

export const notificationSettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
