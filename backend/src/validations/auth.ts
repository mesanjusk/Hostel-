import { z } from "zod";

import { normalizeMobile } from "@/lib/phone";
import { COLLEGE_CATEGORY_OPTIONS, GENDER_OPTIONS } from "@/types";

export const genderSchema = z.enum(GENDER_OPTIONS, { message: "Select a gender" });
/** Legacy fixed-enum validator — still used by the admin users list filter. New onboarding
 * and profile-edit flows use collegeCategoryId/courseId (see collegeCategoryIdSchema below)
 * against the DB-driven CollegeCategory/Course catalog instead. */
export const collegeCategorySchema = z.enum(COLLEGE_CATEGORY_OPTIONS, {
  message: "Select a college category",
});

const objectIdSchema = z.string().trim().regex(/^[a-f0-9]{24}$/i, "Invalid id");
export const collegeCategoryIdSchema = objectIdSchema;
export const courseIdSchema = objectIdSchema;

export const mobileSchema = z
  .string()
  .trim()
  .min(1, "Enter your mobile number")
  .transform((val, ctx) => {
    const normalized = normalizeMobile(val);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid 10-digit Indian mobile number",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const loginSchema = z.object({
  mobile: mobileSchema,
  pin: z.string().trim().min(1, "Enter your login code"),
});

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  gender: genderSchema,
  college: z.string().trim().min(1, "Enter your college name").max(120, "College name is too long"),
  collegeCategoryId: collegeCategoryIdSchema,
  courseId: courseIdSchema,
});

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

// Optional custom login code a user can set instead of falling back to the WhatsApp OTP
// itself — same shape the login screen already accepts (6 or 7 digits).
const customPinSchema = z
  .string()
  .trim()
  .regex(/^\d{6,7}$/, "Login code must be 6-7 digits")
  .optional();

export const otpRequestSchema = z.object({
  mobile: mobileSchema,
});

export const checkMobileSchema = z.object({
  mobile: mobileSchema,
});

export const registerVerifySchema = z.object({
  mobile: mobileSchema,
  code: otpCodeSchema,
  pin: customPinSchema,
});

export const resetPasswordSchema = z.object({
  mobile: mobileSchema,
  code: otpCodeSchema,
  pin: customPinSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type CheckMobileInput = z.infer<typeof checkMobileSchema>;
export type RegisterVerifyInput = z.infer<typeof registerVerifySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
