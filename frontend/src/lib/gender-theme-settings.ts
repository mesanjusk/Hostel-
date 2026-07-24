import { api } from "@/lib/api";
import { setAdminBoyStickerSlugs, setAdminCustomStickers, setAdminGirlStickerSlugs } from "@/lib/gender-stickers";

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
  backgroundColor: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  stickerSlugs: string[];
  customStickers: GenderThemeCustomSticker[];
  noteColors: GenderThemeNoteColors;
}

type GenderThemeSettingsMap = Record<"Male" | "Female", GenderThemeSettingsDTO>;

let cache: GenderThemeSettingsMap | null = null;
let inFlight: Promise<GenderThemeSettingsMap | null> | null = null;

/**
 * Fetches the admin-configured theme overrides once per page load (every caller shares the same
 * request/result — see useColorTheme). Never throws: a network failure, or a brand new
 * deployment with no GenderThemeSettings doc yet, both just mean "no overrides" — the hardcoded
 * defaults in index.css and gender-stickers.ts are the actual source of truth for anyone the
 * admin hasn't customized, so this is purely an optional layer on top, never a hard dependency.
 */
export function ensureGenderThemeSettingsLoaded(): Promise<GenderThemeSettingsMap | null> {
  if (cache) return Promise.resolve(cache);
  if (inFlight) return inFlight;

  inFlight = api
    .get<{ settings: GenderThemeSettingsMap }>("/api/gender-theme")
    .then(({ settings }) => {
      cache = settings;
      setAdminBoyStickerSlugs(settings.Male?.stickerSlugs ?? null);
      setAdminGirlStickerSlugs(settings.Female?.stickerSlugs ?? null);
      setAdminCustomStickers("Male", settings.Male?.customStickers ?? null);
      setAdminCustomStickers("Female", settings.Female?.customStickers ?? null);
      return settings;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** @deprecated Legacy: the palette is now driven by the explicit color theme (data-theme, see
 * use-color-theme.ts), not gender, so this is no longer called at runtime. Kept for reference
 * (and in case a future admin-configurable per-theme override is wanted). The admin Gender Theme
 * panel still saves these values; only their auto-application on load was removed.
 *
 * Applies (or clears) one gender key's admin color overrides as inline CSS custom properties on
 * <html>. Only ever touches the background plus the five brand tokens; --success/--warning/
 * --destructive etc. are never overridden here. */
export function applyGenderColorOverrides(genderKey: "Male" | "Female", settings: GenderThemeSettingsMap | null) {
  const root = document.documentElement.style;
  const s = settings?.[genderKey];

  root.removeProperty("--background");
  root.removeProperty("--primary");
  root.removeProperty("--secondary");
  root.removeProperty("--accent");
  root.removeProperty("--ring");
  root.removeProperty("--gradient-brand");

  if (!s) return;

  if (s.backgroundColor) root.setProperty("--background", s.backgroundColor);
  if (s.primaryColor) {
    root.setProperty("--primary", s.primaryColor);
    root.setProperty("--ring", s.primaryColor);
  }
  if (s.secondaryColor) root.setProperty("--secondary", s.secondaryColor);
  if (s.accentColor) root.setProperty("--accent", s.accentColor);
  if (s.gradientFrom && s.gradientTo) {
    root.setProperty("--gradient-brand", `linear-gradient(135deg, ${s.gradientFrom} 0%, ${s.gradientTo} 100%)`);
  }
}

/** @deprecated Legacy alongside applyGenderColorOverrides above — no longer called at runtime now
 * that the palette is theme-driven. Kept for reference.
 *
 * Applies (or clears) one gender key's admin sticky-note color overrides as inline CSS custom
 * properties on <html>. Distinct set of tokens (NOTE_COLORS in
 * components/shared/scrapbook-pieces.tsx) rather than the five brand tokens. */
export function applyGenderNoteColorOverrides(genderKey: "Male" | "Female", settings: GenderThemeSettingsMap | null) {
  const root = document.documentElement.style;
  const s = settings?.[genderKey]?.noteColors;

  root.removeProperty("--note-yellow");
  root.removeProperty("--note-pink");
  root.removeProperty("--note-blue");
  root.removeProperty("--note-lavender");

  if (!s) return;

  if (s.yellow) root.setProperty("--note-yellow", s.yellow);
  if (s.pink) root.setProperty("--note-pink", s.pink);
  if (s.blue) root.setProperty("--note-blue", s.blue);
  if (s.lavender) root.setProperty("--note-lavender", s.lavender);
}
