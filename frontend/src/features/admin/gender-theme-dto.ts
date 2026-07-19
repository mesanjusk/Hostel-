/** Mirrors backend/src/services/genderThemeService.ts's GenderThemeSettingsDTO — no
 * transformation needed between wire shape and UI shape, unlike most other admin DTOs, since
 * the API already returns exactly this. */
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
  key: "Male" | "Female";
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  stickerSlugs: string[];
  customStickers: GenderThemeCustomSticker[];
  noteColors: GenderThemeNoteColors;
}

export type GenderThemeSettingsMap = Record<"Male" | "Female", GenderThemeSettingsDTO>;
