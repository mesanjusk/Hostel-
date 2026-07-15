import { z } from "zod";

import { GENDER_OPTIONS } from "@/types";

/** Shared by onboarding and profile-edit. College category is DB-driven (admin-managed
 * CollegeCategory catalog) rather than a hardcoded enum. Course isn't collected at
 * registration — it's a voluntary field the user can fill in later from their profile — so
 * it's optional here; the onboarding form simply never renders it. Same for home town, which
 * only ever appears on the profile-edit form. */
export const profileFieldsSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  gender: z.enum(GENDER_OPTIONS, { message: "Select a gender" }),
  college: z.string().trim().min(1, "Enter your college name").max(120, "College name is too long"),
  collegeCategoryId: z.string().trim().min(1, "Select a college category"),
  courseId: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(1, "Select your city").max(80, "City name is too long"),
  homeTown: z.string().trim().max(80, "Home town is too long").optional().or(z.literal("")),
});

export type ProfileFieldsInput = z.infer<typeof profileFieldsSchema>;
