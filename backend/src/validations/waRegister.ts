import { z } from "zod";

import { mobileSchema } from "@/validations/auth";

export const waRegisterStartSchema = z.object({
  mobile: mobileSchema,
  pin: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

export const waRegisterStatusSchema = z.object({
  pendingId: z.string().trim().regex(/^[a-f0-9]{24}$/i, "Invalid pendingId"),
});

export type WaRegisterStartInput = z.infer<typeof waRegisterStartSchema>;
export type WaRegisterStatusInput = z.infer<typeof waRegisterStatusSchema>;
