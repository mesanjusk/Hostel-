import { z } from "zod";

import { GENDER_OPTIONS, INTEREST_OPTIONS, OCCUPATION_OPTIONS } from "@/types";

/** Full profile-edit form (profile-view.tsx): every field the account can carry. College
 * category is DB-driven (admin-managed CollegeCategory catalog) rather than a hardcoded enum.
 * Course, home town, occupation, and interests are voluntary, filled in later from the profile
 * page. */
export const profileFieldsSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
    gender: z.enum(GENDER_OPTIONS, { message: "Select a gender" }),
    occupation: z.enum(OCCUPATION_OPTIONS).optional(),
    // College category + name are required for students but not for working professionals (the
    // form disables both fields for them) — enforced conditionally in the superRefine below.
    // Kept as plain strings (empty allowed) rather than made optional, so ProfileFieldsInput
    // still satisfies CollegeFields' `{ college: string; collegeCategoryId: string }` generic.
    college: z.string().trim().max(120, "College name is too long"),
    collegeCategoryId: z.string().trim(),
    courseId: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().min(1, "Select your city").max(80, "City name is too long"),
    homeTown: z.string().trim().max(80, "Home town is too long").optional().or(z.literal("")),
    interests: z.array(z.enum(INTEREST_OPTIONS)).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.occupation !== "Working Professional") {
      if (!data.college) {
        ctx.addIssue({ path: ["college"], code: z.ZodIssueCode.custom, message: "Enter your college name" });
      }
      if (!data.collegeCategoryId) {
        ctx.addIssue({ path: ["collegeCategoryId"], code: z.ZodIssueCode.custom, message: "Select a college category" });
      }
    }
  });

export type ProfileFieldsInput = z.infer<typeof profileFieldsSchema>;

/** Onboarding now collects only name — gender is picked earlier, on the pre-login landing
 * page (see landing-view.tsx), and everything else (college, city, etc.) is deferred to the
 * one-time Community profile-setup prompt (see community-profile-setup-dialog.tsx), shown the
 * first time the student opens Community. */
export const onboardingNameSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
});

export type OnboardingNameInput = z.infer<typeof onboardingNameSchema>;

/** The college/city fields deferred out of onboarding, collected instead the first time the
 * student opens Community — see community-profile-setup-dialog.tsx. */
export const communitySetupFieldsSchema = z.object({
  college: z.string().trim().min(1, "Enter your college name").max(120, "College name is too long"),
  collegeCategoryId: z.string().trim().min(1, "Select a college category"),
  city: z.string().trim().min(1, "Select your city").max(80, "City name is too long"),
});

export type CommunitySetupFieldsInput = z.infer<typeof communitySetupFieldsSchema>;
