/** Mirrors backend/src/services/genderThemeService.ts's GenderThemeSettingsDTO — no
 * transformation needed between wire shape and UI shape, unlike most other admin DTOs, since
 * the API already returns exactly this. */
export interface GenderThemeSettingsDTO {
  key: "Male" | "Female";
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  stickerSlugs: string[];
}

export type GenderThemeSettingsMap = Record<"Male" | "Female", GenderThemeSettingsDTO>;
