/** Minimal in-memory sliding-window limiter shared by REST message endpoints and the socket
 * layer, so "how fast can one user post" is enforced consistently regardless of transport.
 * Single-process only (matches this app's current single Render instance) — swap for a Redis-
 * backed counter if the backend ever scales to multiple instances. */
const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, maxEvents: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);
  if (recent.length >= maxEvents) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

// Periodically drop keys with no recent activity so this doesn't grow unbounded across
// millions of distinct users over the process lifetime.
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [key, timestamps] of hits) {
    if (timestamps.every((t) => t < cutoff)) hits.delete(key);
  }
}, 5 * 60 * 1000).unref();
