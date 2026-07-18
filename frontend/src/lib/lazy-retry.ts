import { lazy as reactLazy, type ComponentType } from "react";

// Scoped to this tab's session, not localStorage: a different tab (or a later visit) should
// get its own fresh attempt rather than inheriting a stale "already reloaded" flag forever.
const RELOAD_FLAG_KEY = "pwm_chunk_reload_attempted";

function importWithRetry<T>(factory: () => Promise<T>, attemptsLeft: number, delayMs: number): Promise<T> {
  return factory()
    .then((mod) => {
      sessionStorage.removeItem(RELOAD_FLAG_KEY);
      return mod;
    })
    .catch((error) => {
      if (attemptsLeft > 1) {
        return new Promise<void>((resolve) => setTimeout(resolve, delayMs)).then(() =>
          importWithRetry(factory, attemptsLeft - 1, delayMs * 2),
        );
      }
      // Out of retries. A route chunk gone missing (post-deploy hash change) or unreachable
      // (server down/timing out) is normally fixed by a fresh index.html — try that once per
      // tab session before giving up and letting the error boundary show a retry prompt.
      if (!sessionStorage.getItem(RELOAD_FLAG_KEY)) {
        sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
        window.location.reload();
        return new Promise<T>(() => {});
      }
      throw error;
    });
}

/**
 * Drop-in replacement for React.lazy() that tolerates a flaky connection to the server: retries
 * the chunk fetch with backoff, then reloads the page once if it's still unreachable, before
 * finally letting the error propagate to the nearest error boundary. Mirrors React.lazy's own
 * type signature (it uses `any` in the same spot, for the same reason: T's props are contravariant).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return reactLazy(() => importWithRetry(factory, 3, 500));
}
