import { z } from "zod";

import { COMMUNITY_VISIBILITY } from "@/types";

export const createCommunitySchema = z.object({
  name: z.string().trim().min(3, "Name is too short").max(120),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(8).optional().nullable(),
  visibility: z.enum(COMMUNITY_VISIBILITY).optional(),
  allowAnonymous: z.boolean().optional(),
});
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;

export const listCommunitiesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const createChannelSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  topic: z.string().trim().max(200).optional(),
  allowAnonymous: z.boolean().optional(),
});
export type CreateChannelInput = z.infer<typeof createChannelSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "moderator", "verified", "member"]),
});

export const usernameUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,32}$/, "3-32 characters: letters, numbers, underscore only"),
});

export const publicProfileUpdateSchema = z.object({
  displayName: z.string().trim().max(40).optional(),
  bio: z.string().trim().max(200).optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  campus: z.string().trim().max(120).optional().nullable(),
  year: z.string().trim().max(20).optional().nullable(),
});
