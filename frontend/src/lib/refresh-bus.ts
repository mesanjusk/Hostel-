/**
 * Lightweight pub-sub standing in for Next's router.refresh(): feature dialogs call
 * emitRefresh() after a successful mutation, and list views subscribe to refetch —
 * since there's no shared server cache to revalidate in a plain SPA.
 */
const listeners = new Set<() => void>();

export function emitRefresh() {
  for (const listener of listeners) listener();
}

export function subscribeRefresh(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
