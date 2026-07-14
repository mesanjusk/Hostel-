import { z } from "zod";

import { COLLEGE_CATEGORY_OPTIONS, GENDER_OPTIONS } from "@/types";

/** Shared by onboarding and profile-edit — same 4 required fields either way. */
export const profileFieldsSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  gender: z.enum(GENDER_OPTIONS, { message: "Select a gender" }),
  college: z.string().trim().min(1, "Enter your college name").max(120, "College name is too long"),
  collegeCategory: z.enum(COLLEGE_CATEGORY_OPTIONS, { message: "Select a college category" }),
});

export type ProfileFieldsInput = z.infer<typeof profileFieldsSchema>;
