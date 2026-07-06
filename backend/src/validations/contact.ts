import { z } from "zod";

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  relation: z.string().trim().min(1, "Relation is required").max(60),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
});

export const emergencyContactUpdateSchema = emergencyContactSchema.partial().extend({
  id: z.string().min(1),
});

export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;
export type EmergencyContactUpdateInput = z.infer<typeof emergencyContactUpdateSchema>;
