import { z } from "zod";

import { normalizeMobile } from "@/lib/phone";

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
  college: z.string().trim().max(120).optional().or(z.literal("")),
  hostel: z.string().trim().max(120).optional().or(z.literal("")),
  roomNumber: z.string().trim().max(20).optional().or(z.literal("")),
});

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

const newPinSchema = z
  .string()
  .trim()
  .regex(/^\d{7}$/, "Choose a 7-digit login code");

export const otpRequestSchema = z.object({
  mobile: mobileSchema,
});

export const registerVerifySchema = z.object({
  mobile: mobileSchema,
  code: otpCodeSchema,
  pin: newPinSchema,
});

export const resetPasswordSchema = z.object({
  mobile: mobileSchema,
  code: otpCodeSchema,
  pin: newPinSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type RegisterVerifyInput = z.infer<typeof registerVerifySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
