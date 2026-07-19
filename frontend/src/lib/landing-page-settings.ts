import { useEffect, useState } from "react";

import { api } from "@/lib/api";

export interface LandingPageSettingsDTO {
  girlImageUrl: string | null;
  boyImageUrl: string | null;
  logoUrl: string | null;
  logoRedirectUrl: string | null;
}

let cache: LandingPageSettingsDTO | null = null;
let inFlight: Promise<LandingPageSettingsDTO | null> | null = null;

/**
 * Fetches the admin-uploaded girl/boy placeholder images once per page load (every caller
 * shares the same request/result — see useLandingPageSettings below). Never throws: a network
 * failure, or a brand new deployment with no LandingPageSettings doc yet, both just mean "no
 * images yet" — the landing page falls back to a neutral SVG placeholder, never a hard
 * dependency. Same singleton-cache shape as gender-theme-settings.ts's
 * ensureGenderThemeSettingsLoaded.
 */
export function ensureLandingPageSettingsLoaded(): Promise<LandingPageSettingsDTO | null> {
  if (cache) return Promise.resolve(cache);
  if (inFlight) return inFlight;

  inFlight = api
    .get<{ settings: LandingPageSettingsDTO }>("/api/landing-settings")
    .then(({ settings }) => {
      cache = settings;
      return settings;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Public hook for the /welcome landing view — resolves to null while loading or on failure, in
 * which case callers should render the neutral SVG placeholder rather than wait. */
export function useLandingPageSettings(): LandingPageSettingsDTO | null {
  const [settings, setSettings] = useState<LandingPageSettingsDTO | null>(cache);

  useEffect(() => {
    let cancelled = false;
    ensureLandingPageSettingsLoaded().then((result) => {
      if (!cancelled) setSettings(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}
