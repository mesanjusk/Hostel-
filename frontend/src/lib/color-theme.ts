/**
 * Color-theme preference + definitions. The app's visual palette is an explicit, reversible
 * choice (Blossom / Harbor / Meadow / Sunset) stored per-device in localStorage — it replaces the
 * old gender-driven palette. Blossom is the default and is byte-identical to today's `:root` pink
 * palette, so existing users see no change unless they pick another theme.
 *
 * Kept deliberately dependency-free (no React, no DOM beyond localStorage/window) so it can be
 * imported anywhere. The `data-theme` attribute application lives in use-color-theme.ts.
 */

export const COLOR_THEMES = [
  { id: "blossom", name: "Blossom", mood: "warm & soft", accent: "#c96b9a", tint: "#f9edf3" },
  { id: "harbor", name: "Harbor", mood: "cool & calm", accent: "#2e8bc0", tint: "#e7f1f9" },
  { id: "meadow", name: "Meadow", mood: "fresh & green", accent: "#3f9d6d", tint: "#e8f4ec" },
  { id: "sunset", name: "Sunset", mood: "bright & warm", accent: "#dd7a4d", tint: "#fbeee2" },
] as const;

export type ColorThemeId = (typeof COLOR_THEMES)[number]["id"];

const KEY = "pwm_color_theme";
const DEFAULT: ColorThemeId = "blossom";
const IDS = COLOR_THEMES.map((t) => t.id) as ColorThemeId[];

/** Same-tab listeners never receive the native `storage` event (it only fires in *other* tabs),
 * so writeColorTheme dispatches this custom event and useColorTheme listens for it to repaint. */
export const COLOR_THEME_EVENT = "pwm:color-theme";

export function readColorTheme(): ColorThemeId {
  try {
    const v = localStorage.getItem(KEY) as ColorThemeId | null;
    return v && IDS.includes(v) ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function writeColorTheme(id: ColorThemeId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* storage blocked (private mode / disabled) — falls back to default, no persistence */
  }
  window.dispatchEvent(new CustomEvent(COLOR_THEME_EVENT, { detail: id }));
}
