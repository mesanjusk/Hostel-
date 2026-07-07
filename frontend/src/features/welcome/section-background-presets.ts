export const SECTION_BACKGROUND_PRESETS = {
  cream: "#fdf6ee",
  sunrise:
    "radial-gradient(circle at 25% 20%, #ffd6e8 0%, transparent 45%), radial-gradient(circle at 75% 15%, #cfeaff 0%, transparent 45%), radial-gradient(circle at 50% 85%, #e3d9ff 0%, transparent 50%), #fdf6ee",
  dusk: "linear-gradient(180deg, #d9c8ff 0%, #b8ddff 45%, #ffc2dd 100%)",
} as const;

export type SectionBackgroundPresetId = keyof typeof SECTION_BACKGROUND_PRESETS;

export const SECTION_BACKGROUND_PRESET_LABELS: Record<SectionBackgroundPresetId, string> = {
  cream: "Cream",
  sunrise: "Sunrise gradient",
  dusk: "Dusk gradient",
};
