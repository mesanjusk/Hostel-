import { z } from "zod";

import { GENDER_OPTIONS } from "@/types";

/** Shared by onboarding and profile-edit — same 4 required fields either way. */
export const profileFieldsSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  gender: z.enum(GENDER_OPTIONS).optional().nullable(),
  college: z.string().trim().min(1, "Enter your college name").max(120, "College name is too long"),
  collegeCategory: z.string().trim().min(1, "Select a college category").max(80),
  collegeCategoryId: z.string().optional(),
  course: z.string().trim().min(1, "Select a course").max(100),
  courseId: z.string().optional(),
});

export type ProfileFieldsInput = z.infer<typeof profileFieldsSchema>;
