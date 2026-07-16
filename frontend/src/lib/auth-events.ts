/**
 * Pub-sub so the API client can announce "the server rejected our token" without importing
 * auth-context (which would create a cycle back into api.ts). auth-context subscribes once
 * and clears the session; ProtectedRoute then redirects to /wa-login on its own.
 */
const listeners = new Set<() => void>();

export function emitUnauthorized() {
  for (const listener of listeners) listener();
}

export function subscribeUnauthorized(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
