import type { UserDTO } from "@/types";

/** Last confirmed /api/auth/me payload, persisted so the next app boot can render the
 * authenticated shell immediately and revalidate in the background — the same
 * stale-while-revalidate contract as lib/layout-cache. Without this, every full page load
 * (and every PWA launch) held the entire app on a blank screen for the full round-trip to a
 * backend that may be a continent away — or tens of seconds when its free-tier instance was
 * cold. Cleared on logout and on any 401, mirroring checklist-cache's shared-device care. */
const USER_KEY = "pwm_user";

export function readPersistedUser(): UserDTO | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserDTO) : null;
  } catch {
    return null;
  }
}

export function writePersistedUser(user: UserDTO) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage full/blocked — persisting is an optimization, never a requirement.
  }
}

export function clearPersistedUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore — worst case the next boot revalidates before rendering, as before.
  }
}
