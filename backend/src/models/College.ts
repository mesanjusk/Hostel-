import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Admin-curated colleges, scoped to a city + CollegeCategory (e.g. "Engineering colleges in
 * Mumbai"), optionally carrying an NIRF rank so the onboarding/profile college picker can list
 * them best-first. `city` is stored as the plain city name (matching City.name and the string
 * already persisted on User.city) rather than a City FK, since that's the value the picker
 * cascades off. Not every real-world college is expected to be catalogued here — the picker
 * always offers an "Other" fallback for anything missing, so this stays a curated shortlist
 * rather than an exhaustive directory. */
const CollegeSchema = new Schema(
  {
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },
    collegeCategoryId: { type: Schema.Types.ObjectId, ref: "CollegeCategory", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    /** NIRF (National Institutional Ranking Framework) rank, when known. Nullable — unranked
     * colleges still sort after ranked ones, never dropped. */
    nirfRank: { type: Number, default: null, min: 1 },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CollegeSchema.index({ city: 1, collegeCategoryId: 1, slug: 1 }, { unique: true });
CollegeSchema.index({ city: 1, collegeCategoryId: 1, active: 1, nirfRank: 1 });

export type CollegeDocument = InferSchemaType<typeof CollegeSchema>;

export const College: Model<CollegeDocument> =
  models.College || model<CollegeDocument>("College", CollegeSchema);
