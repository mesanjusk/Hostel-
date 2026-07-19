import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const GENDER_THEME_KEYS = ["Male", "Female"] as const;
export type GenderThemeKey = (typeof GENDER_THEME_KEYS)[number];

/** Admin-tunable palette + sticker set for a gender key, one doc per key. "Other" and a null
 * gender both use the "Female" doc (today's default pink theme) — only an explicit Male
 * selection ever picks the "Male" doc, mirroring the same rule the frontend theme/sticker
 * resolvers already follow. All fields are optional overrides: null/empty means "no override,
 * use the hardcoded frontend default" (see frontend/src/index.css and lib/gender-stickers.ts) —
 * so a cold/empty collection (first deploy) never breaks anything, it just means nobody has
 * customized anything yet. */
const GenderThemeSettingsSchema = new Schema(
  {
    key: { type: String, enum: GENDER_THEME_KEYS, required: true, unique: true },
    primaryColor: { type: String, default: null, trim: true },
    secondaryColor: { type: String, default: null, trim: true },
    accentColor: { type: String, default: null, trim: true },
    gradientFrom: { type: String, default: null, trim: true },
    gradientTo: { type: String, default: null, trim: true },
    /** Base sticker slugs (no extension, no /boy prefix) enabled for this gender. Empty means
     * "use the built-in default set" — see BOY_STICKER_SLUGS/GIRL_STICKER_SLUGS in
     * frontend/src/lib/gender-stickers.ts. Only meaningful as a *restriction*: a slug that has
     * no actual art file still silently falls back to the girl .webp, never a broken image. */
    stickerSlugs: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
    /** Admin-uploaded custom stickers ("add from device") for this gender, on top of the
     * built-in slug set. Uploaded via the existing /api/uploads/image endpoint (Cloudinary), so
     * `url` is a full URL, not a local path. Capped at 50 in genderThemeUpdateSchema — plenty for
     * an admin-curated set without the array growing unbounded. */
    customStickers: {
      type: [
        {
          _id: false,
          slug: { type: String, trim: true, maxlength: 60, required: true },
          url: { type: String, trim: true, maxlength: 2000, required: true },
        },
      ],
      default: [],
    },
    /** Sticky-note background color overrides for this gender — see NOTE_COLORS in
     * components/shared/scrapbook-pieces.tsx and the matching CSS custom properties in
     * index.css. Same null-means-"use the shipped default" pattern as primaryColor etc. above.
     * A plain nested object (not `[{...}]`), so mongoose treats it as a single nested path
     * rather than an array subdocument. */
    noteColors: {
      yellow: { type: String, default: null, trim: true },
      pink: { type: String, default: null, trim: true },
      blue: { type: String, default: null, trim: true },
      lavender: { type: String, default: null, trim: true },
    },
  },
  { timestamps: true },
);

export type GenderThemeSettingsDocument = InferSchemaType<typeof GenderThemeSettingsSchema>;

export const GenderThemeSettings: Model<GenderThemeSettingsDocument> =
  models.GenderThemeSettings ||
  model<GenderThemeSettingsDocument>("GenderThemeSettings", GenderThemeSettingsSchema);
