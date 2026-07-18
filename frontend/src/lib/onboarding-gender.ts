import type { Gender } from "@/types";

/** Gender picked on the pre-login landing page, persisted so it survives the redirect through
 * OTP login and lands intact on the onboarding step — which then never has to ask again. Cleared
 * once onboarding actually submits it to the backend (see onboarding-form.tsx). */
const GENDER_KEY = "pwm_onboarding_gender";

export function readSelectedGender(): Gender | null {
  try {
    return localStorage.getItem(GENDER_KEY) as Gender | null;
  } catch {
    return null;
  }
}

export function writeSelectedGender(gender: Gender) {
  try {
    localStorage.setItem(GENDER_KEY, gender);
  } catch {
    // Storage full/blocked — worst case onboarding falls back to asking directly.
  }
}

export function clearSelectedGender() {
  try {
    localStorage.removeItem(GENDER_KEY);
  } catch {
    // Ignore — nothing left to clean up if storage never worked.
  }
}

export function hasSelectedGender(): boolean {
  return readSelectedGender() !== null;
}
