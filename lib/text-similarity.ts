/** Lowercase, trim, collapse whitespace, strip a single trailing "s", drop punctuation. */
export function normalizeItemName(value: string): string {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
  return cleaned.endsWith("s") ? cleaned.slice(0, -1) : cleaned;
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, (_, i) => [
    i,
    ...Array.from({ length: cols - 1 }, () => 0),
  ]);
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[rows - 1][cols - 1];
}

/** True for exact-after-normalization matches or short typo/pluralization variants (e.g. "fee reciept" vs "fee receipts"). */
export function areNearDuplicateNames(a: string, b: string): boolean {
  const na = normalizeItemName(a);
  const nb = normalizeItemName(b);
  if (na === nb) return true;

  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return false;

  const distance = levenshtein(na, nb);
  const threshold = maxLen <= 6 ? 1 : maxLen <= 12 ? 2 : 3;
  return distance <= threshold;
}
