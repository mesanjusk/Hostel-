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

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  college: z.string().trim().max(120).optional().or(z.literal("")),
  hostel: z.string().trim().max(120).optional().or(z.literal("")),
  roomNumber: z.string().trim().max(20).optional().or(z.literal("")),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
