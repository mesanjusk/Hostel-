import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  college: z.string().trim().max(120).optional().or(z.literal("")),
  hostel: z.string().trim().max(120).optional().or(z.literal("")),
  roomNumber: z.string().trim().max(20).optional().or(z.literal("")),
  avatar: z.string().trim().url().optional().or(z.literal("")),
});

export const notificationSettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
