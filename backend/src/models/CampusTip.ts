import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { CAMPUS_TIP_CATEGORIES } from "@/types";

/** Student-contributed "Know Your Campus" info bites, scoped to { city, college } the same way
 * Place is scoped to city. Unlike Place (admin-curated), any authenticated student can post;
 * quality control is the vote score plus the existing Report/moderation flow (`campus_tip`
 * target type) and the admin-only `hidden` kill-switch.
 *
 * Votes are voter-ID arrays on the doc rather than a separate collection — a campus's audience
 * is at most a few hundred users (same reasoning as User.favoritePlaceIds), and it lets a vote
 * toggle be one atomic pipeline update with `score` recomputed in the same write. `score` is
 * denormalized (upvotes − downvotes) purely so the list sort is an index walk; the voter arrays
 * themselves are never sent to clients (see campusTipService.toTipDTO). */
const CampusTipSchema = new Schema(
  {
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },
    college: { type: String, required: true, trim: true, maxlength: 120, index: true },
    category: { type: String, enum: CAMPUS_TIP_CATEGORIES, required: true },
    /** The bite itself — capped well below GuideArticle length on purpose; long-form campus
     * content belongs in the Guide, not here. */
    text: { type: String, required: true, trim: true, maxlength: 400 },
    /** Optional supporting link (maps, menu, official page). Plain URL, no API integration —
     * same stance as Place.mapsLink. */
    linkUrl: { type: String, default: null, trim: true, maxlength: 500 },
    /** Optional photo, uploaded client-side to Cloudinary before the tip is created — this
     * field only ever holds the hosted URL, same pattern as Bag.imageUrl. */
    imageUrl: { type: String, default: null, trim: true, maxlength: 500 },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    upvoterIds: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    downvoterIds: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    score: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true },
);

/** Covers the one public query: this campus's visible tips, best-first, newest tiebreak. */
CampusTipSchema.index({ city: 1, college: 1, hidden: 1, score: -1, createdAt: -1 });

export type CampusTipDocument = InferSchemaType<typeof CampusTipSchema>;

export const CampusTip: Model<CampusTipDocument> =
  models.CampusTip || model<CampusTipDocument>("CampusTip", CampusTipSchema);
