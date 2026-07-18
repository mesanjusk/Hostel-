import { z } from "zod";

import { COMMUNITY_ROLES, COMMUNITY_STATUS, COMMUNITY_VISIBILITY } from "@/types";
import { citySchema, collegeCategoryIdSchema } from "@/validations/auth";

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

export const moderateMemberSchema = z.object({
  muted: z.boolean().optional(),
  banned: z.boolean().optional(),
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
  avatar: z.string().trim().max(500).optional().nullable(),
  bio: z.string().trim().max(200).optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  campus: z.string().trim().max(120).optional().nullable(),
  year: z.string().trim().max(20).optional().nullable(),
});

// One-time prompt shown on first visit to Community — collects the community display name
// plus the college/city details onboarding no longer asks for up front (see
// validations/auth.ts's onboardingSchema, which is now just name + gender).
export const communityProfileSetupSchema = z
  .object({
    useOriginalName: z.boolean(),
    displayName: z.string().trim().min(1, "Enter a name").max(40).optional(),
    college: z.string().trim().min(1, "Enter your college name").max(120, "College name is too long"),
    collegeCategoryId: collegeCategoryIdSchema,
    city: citySchema,
  })
  .refine((data) => data.useOriginalName || Boolean(data.displayName), {
    message: "Enter a name",
    path: ["displayName"],
  });

// --- Site-admin community management -------------------------------------------------------

export const adminListCommunitiesQuerySchema = z.object({
  status: z.enum(COMMUNITY_STATUS).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminUpdateCommunitySchema = z.object({
  name: z.string().trim().min(3, "Name is too short").max(120).optional(),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(8).optional().nullable(),
  visibility: z.enum(COMMUNITY_VISIBILITY).optional(),
  allowAnonymous: z.boolean().optional(),
  isOfficial: z.boolean().optional(),
});

export const adminAddMemberSchema = z.object({
  mobile: z.string().trim().min(1, "Mobile number is required"),
  role: z.enum(COMMUNITY_ROLES).optional(),
});

export const adminBulkAddMembersSchema = z.object({
  city: z.string().trim().max(80).optional(),
  college: z.string().trim().max(120).optional(),
  campus: z.string().trim().max(120).optional(),
  courseId: z.string().trim().optional(),
  all: z.boolean().optional(),
  role: z.enum(COMMUNITY_ROLES).optional(),
});
