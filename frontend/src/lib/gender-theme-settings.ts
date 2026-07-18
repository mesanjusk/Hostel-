import { api } from "@/lib/api";
import { setAdminBoyStickerSlugs } from "@/lib/gender-stickers";

export interface GenderThemeSettingsDTO {
  key: "Male" | "Female";
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  stickerSlugs: string[];
}

type GenderThemeSettingsMap = Record<"Male" | "Female", GenderThemeSettingsDTO>;

let cache: GenderThemeSettingsMap | null = null;
let inFlight: Promise<GenderThemeSettingsMap | null> | null = null;

/**
 * Fetches the admin-configured theme overrides once per page load (every caller shares the same
 * request/result — see useGenderTheme). Never throws: a network failure, or a brand new
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
      return settings;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Applies (or clears) one gender key's admin color overrides as inline CSS custom properties
 * on <html> — inline styles win over both the default and `[data-gender="male"]` blocks in
 * index.css by CSS origin, so this is always the final word once it resolves. Only ever touches
 * the five brand tokens; --success/--warning/--destructive etc. are never overridden here. */
export function applyGenderColorOverrides(genderKey: "Male" | "Female", settings: GenderThemeSettingsMap | null) {
  const root = document.documentElement.style;
  const s = settings?.[genderKey];

  root.removeProperty("--primary");
  root.removeProperty("--secondary");
  root.removeProperty("--accent");
  root.removeProperty("--ring");
  root.removeProperty("--gradient-brand");

  if (!s) return;

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
