import { useEffect, useState } from "react";

import { COLOR_THEME_EVENT, readColorTheme, type ColorThemeId } from "@/lib/color-theme";
import { ensureGenderThemeSettingsLoaded } from "@/lib/gender-theme-settings";

/**
 * Drives the app's color theme end to end. Called once, near the app root (see App.tsx). Replaces
 * useGenderTheme's palette role: the visual palette is now an explicit per-device choice, not tied
 * to the user's gender.
 *
 * - Sets `data-theme="harbor|meadow|sunset"` on <html> for the matching palette in index.css.
 *   Blossom (the default) removes the attribute entirely so `:root` applies — byte-for-byte the
 *   pink palette that shipped before this feature.
 * - Repaints instantly with no reload: writeColorTheme() fires COLOR_THEME_EVENT (same tab) and
 *   the browser fires `storage` (other tabs); both re-read the preference and flip the attribute,
 *   so every --primary/--accent/etc. token cascades live.
 * - Still loads the admin Gender Theme settings once, purely for their sticker-slug config
 *   (setAdmin*StickerSlugs, called inside ensureGenderThemeSettingsLoaded). The admin panel's
 *   gender-keyed *color* overrides are no longer applied — the palette is theme-driven now — but
 *   the sticker config is independent of color and is preserved.
 */
export function useColorTheme() {
  const [theme, setTheme] = useState<ColorThemeId>(readColorTheme);

  useEffect(() => {
    const sync = () => setTheme(readColorTheme());
    window.addEventListener(COLOR_THEME_EVENT, sync);
    window.addEventListener("storage", sync); // other tabs
    return () => {
      window.removeEventListener(COLOR_THEME_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (theme === "blossom") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Load admin-configured sticker slugs (color overrides are intentionally not applied here).
  useEffect(() => {
    ensureGenderThemeSettingsLoaded();
  }, []);

  return theme;
}
