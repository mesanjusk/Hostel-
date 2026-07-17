import { z } from "zod";

import { ACCOMMODATION_TYPES, DISCOVERY_CONTEXTS, GENDER_OPTIONS } from "@/types";

export const travelProfileSchema = z
  .object({
    currentCity: z.string().trim().max(80).optional().nullable(),
    destinationCity: z.string().trim().min(1, "Enter your destination city").max(80),
    college: z.string().trim().max(120).optional().nullable(),
    // Budget, accommodation type and gender preference are mandatory: roommate matching treats
    // all three as hard requirements (see findRoommates), so a profile without them can never
    // match anyone and would leave the student staring at an empty Find a Roomie with no clue
    // why. Collect them up front rather than letting that state be saved.
    budgetMin: z.coerce.number().min(0),
    budgetMax: z.coerce.number().min(0),
    accommodationType: z.enum([...ACCOMMODATION_TYPES, "Any"]),
    genderPreference: z.enum([...GENDER_OPTIONS, "Any"]),
    ageRangeMin: z.coerce.number().min(16).max(100).optional().nullable(),
    ageRangeMax: z.coerce.number().min(16).max(100).optional().nullable(),
    interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    languages: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    lifestyleTags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    visibility: z
      .object({
        hideProfile: z.boolean().optional(),
        onlyShowVerified: z.boolean().optional(),
        onlyShowSameGender: z.boolean().optional(),
      })
      .optional(),
    active: z.boolean().optional(),
  })
  // An inverted range would break the budget-overlap test, which reads min/max as a real span.
  .refine((v) => v.budgetMax >= v.budgetMin, {
    message: "Max budget can't be less than the minimum",
    path: ["budgetMax"],
  });

export type TravelProfileInput = z.infer<typeof travelProfileSchema>;

export const discoveryQuerySchema = z.object({
  gender: z.enum(GENDER_OPTIONS).optional(),
  ageMin: z.coerce.number().min(16).max(100).optional(),
  ageMax: z.coerce.number().min(16).max(100).optional(),
  college: z.string().trim().max(120).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
  // Only concrete types: "Any" here would mean "don't filter", which is what omitting it does.
  accommodationType: z.enum(ACCOMMODATION_TYPES).optional(),
});

export type DiscoveryQuery = z.infer<typeof discoveryQuerySchema>;

export const sendConnectionSchema = z.object({
  recipientId: z.string().min(1),
  context: z.enum(DISCOVERY_CONTEXTS),
  message: z.string().trim().max(300).optional(),
});

export const respondConnectionSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

export const blockUserSchema = z.object({
  userId: z.string().min(1),
});
