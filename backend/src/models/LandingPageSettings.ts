import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Singleton doc (one row, `key: "welcome"`) holding the admin-uploaded placeholder images for
 * the pre-login /welcome gender-pick cards (see frontend/src/features/auth/landing-view.tsx).
 * Both fields are optional Cloudinary URLs — null/unset means "no image uploaded yet", in which
 * case the landing page falls back to a neutral SVG placeholder rather than a hardcoded
 * illustration. Uploaded via the existing /api/uploads/image endpoint, same as gender-theme's
 * custom stickers. */
const LandingPageSettingsSchema = new Schema(
  {
    key: { type: String, default: "welcome", unique: true },
    girlImageUrl: { type: String, default: null, trim: true, maxlength: 2000 },
    boyImageUrl: { type: String, default: null, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

export type LandingPageSettingsDocument = InferSchemaType<typeof LandingPageSettingsSchema>;

export const LandingPageSettings: Model<LandingPageSettingsDocument> =
  models.LandingPageSettings ||
  model<LandingPageSettingsDocument>("LandingPageSettings", LandingPageSettingsSchema);
