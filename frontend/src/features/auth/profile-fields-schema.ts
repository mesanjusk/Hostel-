import { z } from "zod";

import { GENDER_OPTIONS } from "@/types";

/** Shared by onboarding and profile-edit — same required fields either way. College category
 * and course are now DB-driven ids (admin-managed CollegeCategory/Course catalog) rather than
 * a hardcoded enum. */
export const profileFieldsSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  gender: z.enum(GENDER_OPTIONS, { message: "Select a gender" }),
  college: z.string().trim().min(1, "Enter your college name").max(120, "College name is too long"),
  collegeCategoryId: z.string().trim().min(1, "Select a college category"),
  courseId: z.string().trim().min(1, "Select a course"),
});

export type ProfileFieldsInput = z.infer<typeof profileFieldsSchema>;
