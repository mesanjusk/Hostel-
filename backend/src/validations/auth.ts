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

export const citySchema = z.string().trim().min(1, "Select your city").max(80);

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

// Same convention as checklist items' photo field: client-compressed base64 data URI, or a
// plain https URL. Optional — a profile picture is never required to finish onboarding.
const avatarImageField = z
  .string()
  .trim()
  .max(200_000, "Image is too large")
  .refine((val) => val === "" || val.startsWith("data:image/") || /^https?:\/\//i.test(val), {
    message: "Image must be a photo or a valid URL",
  })
  .optional()
  .or(z.literal(""));

// College/city/course are deliberately not collected at registration — onboarding stays down
// to name + gender, and the rest is collected the first time the student opens Community (see
// communityProfileSetupSchema).
export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  gender: genderSchema,
  avatar: avatarImageField,
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

// MSG91 "Login with OTP" widget access-token, posted by the browser after it verifies the OTP.
// It's a JWT the backend re-confirms with MSG91 (see msg91Service.verifyWidgetToken) — we only
// need to check it's a non-empty string here; MSG91 is the authority on its validity.
export const widgetVerifySchema = z.object({
  accessToken: z.string().trim().min(1, "Missing access token"),
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
