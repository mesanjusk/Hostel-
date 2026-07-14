/** Returns the most frequently occurring value in a list (ties broken by first occurrence),
 * or null for an empty list. Used to derive "most popular category/course" for checklist
 * item and suggested-item analytics. */
export function mostFrequent<T>(values: T[]): T | null {
  if (values.length === 0) return null;

  const counts = new Map<string, { value: T; count: number }>();
  for (const value of values) {
    const key = String(value);
    const entry = counts.get(key) ?? { value, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }

  let best: { value: T; count: number } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best?.value ?? null;
}
