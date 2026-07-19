import { connectDB } from "@/db";
import { GENDER_THEME_KEYS, GenderThemeSettings, type GenderThemeKey } from "@/models/GenderThemeSettings";

export { GENDER_THEME_KEYS, type GenderThemeKey };

export interface GenderThemeNoteColors {
  yellow: string | null;
  pink: string | null;
  blue: string | null;
  lavender: string | null;
}

export interface GenderThemeCustomSticker {
  slug: string;
  url: string;
}

export interface GenderThemeSettingsDTO {
  key: GenderThemeKey;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  stickerSlugs: string[];
  customStickers: GenderThemeCustomSticker[];
  noteColors: GenderThemeNoteColors;
}

// Deliberately loose rather than `Partial<GenderThemeSettingsDTO>`: the lean() mongoose doc's
// inferred shape has `noteColors` (and each of its fields) as possibly `null`, not just
// possibly-absent, since it's an optional nested path rather than a required one — this just
// needs to accept whatever shape a lean doc (or `null`, for a cold collection) actually has.
interface GenderThemeSettingsDocLike {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  gradientFrom?: string | null;
  gradientTo?: string | null;
  stickerSlugs?: string[] | null;
  customStickers?: GenderThemeCustomSticker[] | null;
  noteColors?: {
    yellow?: string | null;
    pink?: string | null;
    blue?: string | null;
    lavender?: string | null;
  } | null;
}

function toDTO(key: GenderThemeKey, doc: GenderThemeSettingsDocLike | null): GenderThemeSettingsDTO {
  return {
    key,
    primaryColor: doc?.primaryColor ?? null,
    secondaryColor: doc?.secondaryColor ?? null,
    accentColor: doc?.accentColor ?? null,
    gradientFrom: doc?.gradientFrom ?? null,
    gradientTo: doc?.gradientTo ?? null,
    stickerSlugs: doc?.stickerSlugs ?? [],
    customStickers: doc?.customStickers ?? [],
    noteColors: {
      yellow: doc?.noteColors?.yellow ?? null,
      pink: doc?.noteColors?.pink ?? null,
      blue: doc?.noteColors?.blue ?? null,
      lavender: doc?.noteColors?.lavender ?? null,
    },
  };
}

/** Public — read by every visitor's boot-time theme fetch (including signed-out /welcome
 * previews), so this must stay auth-free. Always returns both keys, with null/empty fields
 * where no admin doc exists yet; the frontend layers these over its own hardcoded defaults, so
 * an empty collection or a failed fetch never breaks the app. */
export async function getAllGenderThemeSettings(): Promise<Record<GenderThemeKey, GenderThemeSettingsDTO>> {
  await connectDB();
  const docs = await GenderThemeSettings.find({ key: { $in: GENDER_THEME_KEYS } }).lean();
  const byKey = new Map(docs.map((d) => [d.key as GenderThemeKey, d]));
  return {
    Male: toDTO("Male", byKey.get("Male") ?? null),
    Female: toDTO("Female", byKey.get("Female") ?? null),
  };
}

/** Admin-only: full-replace upsert of one gender key's overrides (mirrors the "form always
 * submits the whole current state" pattern used by the other admin CRUD forms in this repo). */
export async function updateGenderThemeSettings(
  key: GenderThemeKey,
  updates: Omit<GenderThemeSettingsDTO, "key">,
): Promise<GenderThemeSettingsDTO> {
  await connectDB();
  const doc = await GenderThemeSettings.findOneAndUpdate(
    { key },
    { $set: { key, ...updates } },
    { upsert: true, new: true },
  ).lean();
  return toDTO(key, doc);
}
