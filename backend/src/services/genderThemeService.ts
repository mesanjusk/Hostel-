import { connectDB } from "@/db";
import { GENDER_THEME_KEYS, GenderThemeSettings, type GenderThemeKey } from "@/models/GenderThemeSettings";

export { GENDER_THEME_KEYS, type GenderThemeKey };

export interface GenderThemeSettingsDTO {
  key: GenderThemeKey;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  stickerSlugs: string[];
}

function toDTO(key: GenderThemeKey, doc: Partial<GenderThemeSettingsDTO> | null): GenderThemeSettingsDTO {
  return {
    key,
    primaryColor: doc?.primaryColor ?? null,
    secondaryColor: doc?.secondaryColor ?? null,
    accentColor: doc?.accentColor ?? null,
    gradientFrom: doc?.gradientFrom ?? null,
    gradientTo: doc?.gradientTo ?? null,
    stickerSlugs: doc?.stickerSlugs ?? [],
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
