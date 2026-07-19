import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "@/context/auth-context";
import { readSelectedGender } from "@/lib/onboarding-gender";
import {
  applyGenderColorOverrides,
  applyGenderNoteColorOverrides,
  ensureGenderThemeSettingsLoaded,
} from "@/lib/gender-theme-settings";

/**
 * Drives the app's gender-based visual theme end to end. Called once, near the app root (see
 * App.tsx).
 *
 * - Sets `data-gender="male"` on <html> for the navy palette (index.css); left unset for
 *   everyone else (Female, Other, or no gender at all) so they get today's exact pink palette,
 *   byte for byte unchanged from before this feature existed.
 * - Layers any admin-configured hex overrides (Gender Theme admin panel) on top of whichever
 *   palette applies, as inline CSS custom properties — cleared back to the built-in defaults
 *   whenever no override is set for that gender.
 *
 * Reactive to `user.gender`, so a live Profile edit repaints instantly with no reload — and, for
 * signed-out visitors, to the pre-login `readSelectedGender()` pick on every route change (that
 * pick is written to localStorage outside of React state on /welcome, so a route change —
 * specifically the one that follows picking it — is the only reliable signal to re-check it).
 */
export function useGenderTheme() {
  const { user } = useAuth();
  const location = useLocation();

  // Falls back to the pre-login pick whenever the backend gender isn't set yet — not just
  // while signed out, but also mid-onboarding (a fresh OTP sign-in already has a `user` object
  // with gender still null right up until the onboarding form submits), so the navy preview
  // started on /welcome doesn't flicker back to pink for those few in-between screens.
  const effectiveGender = user?.gender ?? readSelectedGender();
  const isMale = effectiveGender === "Male";

  useEffect(() => {
    if (isMale) {
      document.documentElement.dataset.gender = "male";
    } else {
      delete document.documentElement.dataset.gender;
    }
    // location.pathname is a deliberate dependency, not dead code: readSelectedGender() reads
    // localStorage, which a route change is the only signal we get for (see writeSelectedGender
    // in landing-view.tsx, called just before navigating away from /welcome).
  }, [isMale, location.pathname]);

  useEffect(() => {
    let cancelled = false;
    ensureGenderThemeSettingsLoaded().then((settings) => {
      if (cancelled) return;
      const key = isMale ? "Male" : "Female";
      applyGenderColorOverrides(key, settings);
      applyGenderNoteColorOverrides(key, settings);
    });
    return () => {
      cancelled = true;
    };
  }, [isMale]);
}
