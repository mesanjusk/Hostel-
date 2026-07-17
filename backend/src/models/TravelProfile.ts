import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { ACCOMMODATION_TYPES, GENDER_OPTIONS } from "@/types";

/** One discovery profile per user, powering both Co-Packer and Roommate discovery — they're
 * the same underlying "where am I moving to and what am I looking for" data, just queried with
 * different filters, so this is a single collection rather than two (see the Atlas
 * collection-cap constraint noted on User.loginAttempts). Opt-in only: a user is discoverable
 * only once they've saved a profile with `active: true`.
 *
 * There is deliberately no date here. Travel month and arrival date used to gate Co-Packer
 * matching, but asking every student to pin a date to be discoverable at all cost more than it
 * bought; both matchers are now purely about place, budget and preference. Documents written
 * before that change still carry the old keys — they're simply unread. */
const TravelProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    currentCity: { type: String, default: null, trim: true, maxlength: 80, index: true },
    destinationCity: { type: String, required: true, trim: true, maxlength: 80, index: true },

    college: { type: String, default: null, trim: true, maxlength: 120 },
    budgetMin: { type: Number, default: null, min: 0 },
    budgetMax: { type: Number, default: null, min: 0 },
    /** "Any" means "I don't mind", exactly as it does for genderPreference — a real answer, and
     * the default, so a student who never opens the picker still matches everyone rather than
     * nobody. It is not in ACCOMMODATION_TYPES because a Booking has to name an actual place. */
    accommodationType: { type: String, enum: [...ACCOMMODATION_TYPES, "Any"], default: "Any" },

    genderPreference: { type: String, enum: [...GENDER_OPTIONS, "Any"], default: "Any" },
    ageRangeMin: { type: Number, default: null, min: 16, max: 100 },
    ageRangeMax: { type: Number, default: null, min: 16, max: 100 },

    interests: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    lifestyleTags: { type: [String], default: [] },

    visibility: {
      hideProfile: { type: Boolean, default: false },
      onlyShowVerified: { type: Boolean, default: false },
      onlyShowSameGender: { type: Boolean, default: false },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

/** Fully covers findCoPackers' mandatory match (destinationCity + currentCity + active) so it
 * doesn't fall back to filtering the last two fields in memory. */
TravelProfileSchema.index({ destinationCity: 1, currentCity: 1, active: 1 });
/** Covers findRoommates' mandatory match (destinationCity + active). */
TravelProfileSchema.index({ destinationCity: 1, active: 1 });

export type TravelProfileDocument = InferSchemaType<typeof TravelProfileSchema>;

export const TravelProfile: Model<TravelProfileDocument> =
  models.TravelProfile || model<TravelProfileDocument>("TravelProfile", TravelProfileSchema);
