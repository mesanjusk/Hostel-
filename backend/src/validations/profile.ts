import { z } from "zod";

import { collegeCategorySchema, courseSchema, genderSchema } from "@/validations/auth";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  gender: genderSchema.optional().nullable(),
  college: z.string().trim().min(1, "Enter your college name").max(120),
  collegeCategory: collegeCategorySchema,
  collegeCategoryId: z.string().trim().min(1).optional(),
  course: courseSchema,
  courseId: z.string().trim().min(1).optional(),
});

export const notificationSettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
