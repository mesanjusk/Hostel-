/**
 * Shared Wikipedia photo lookup, used both by scripts/fetchPlaceImages.ts (manual/admin backfill
 * across existing places) and placeAutoFetchService.ts (automatic backfill right after a new
 * city's places are inserted). Free, needs no API key, and every result is tied to an actual
 * article — so a match can be verified against the place name instead of trusted blindly.
 * Wikipedia's own full-text search is loose though: searching for a small local eatery can
 * return an unrelated but topically-similar article (e.g. a generic dish page) with its own
 * photo, which would misrepresent that place. So every candidate is title-matched against the
 * place name (normalized word overlap) and rejected below MATCH_THRESHOLD rather than attached
 * speculatively — in practice, well-documented landmarks/temples/parks get real photos and small
 * local restaurants/stalls mostly don't, consistent with seedPlaces.ts's "nothing invented"
 * stance.
 */

const WIKI_USER_AGENT = "PackWithMe-PlaceImageFetcher/1.0 (+https://packwithme.instify.in)";
// 0.5 (half the place name's words present in the article title) let through real false
// positives once OSM-sourced generic names were in the mix — e.g. "Shiva Statue" (Rishikesh)
// matched an unrelated "Shiva" statue in Bangalore, and "Hari Om" (a laundry shop) matched a
// photo of a yoga teacher named Hari Dass, both on a single shared word. Raised to require most
// of the name to line up. See isAcceptableMatch for the other guards this alone doesn't cover.
export const MATCH_THRESHOLD = 0.75;
export const WIKI_REQUEST_DELAY_MS = 1200;
const MAX_RETRIES = 4;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Fraction of the place name's words that appear in the candidate article title. */
export function matchScore(placeName: string, articleTitle: string): number {
  const nameTokens = tokenize(placeName);
  if (nameTokens.length === 0) return 0;
  const titleTokens = new Set(tokenize(articleTitle));
  const common = nameTokens.filter((t) => titleTokens.has(t));
  return common.length / nameTokens.length;
}

export interface WikiPage {
  title: string;
  thumbnail?: { source: string };
}

/** Retried on the plain-text rate-limit notice Wikipedia returns instead of JSON when
 * throttling. Throws once MAX_RETRIES is exhausted — callers decide whether that's fatal. */
export async function searchWikipediaImage(query: string): Promise<WikiPage | null> {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=1" +
    "&prop=pageimages&piprop=thumbnail&pithumbsize=1000&format=json" +
    `&gsrsearch=${encodeURIComponent(query)}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": WIKI_USER_AGENT } });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      const pages = data?.query?.pages;
      const page = pages ? (Object.values(pages)[0] as WikiPage) : null;
      return page ?? null;
    } catch {
      await sleep(WIKI_REQUEST_DELAY_MS * (attempt + 1));
    }
  }
  throw new Error(`Wikipedia API request failed after ${MAX_RETRIES} retries: ${query}`);
}

/** The score threshold alone isn't enough: two more failure modes showed up against real
 * OSM-sourced names (see MATCH_THRESHOLD's comment for the word-overlap ones).
 *
 * 1. Names under two words are too generic for full-text search to place reliably ("Cafe",
 *    "Hari Om") — a single shared word can trivially clear even a high threshold against some
 *    unrelated article.
 * 2. A place literally named after its own city — common for OSM railway stations ("Rishikesh"
 *    the station, tagged with the town's name) — scores a trivial 1.0 against the city's own
 *    Wikipedia article, whose infobox photo depicts the city in general (a famous temple, in one
 *    observed case), not that specific venue. Rejected outright rather than scored.
 */
export function isAcceptableMatch(placeName: string, city: string, page: WikiPage | null): page is WikiPage & { thumbnail: { source: string } } {
  if (!page?.thumbnail?.source) return false;
  if (tokenize(placeName).length < 2) return false;
  if (page.title.trim().toLowerCase() === city.trim().toLowerCase()) return false;
  return matchScore(placeName, page.title) >= MATCH_THRESHOLD;
}

/** Convenience wrapper for callers that just want a URL-or-null, without the raw score/title
 * (scripts/fetchPlaceImages.ts wants those for its diagnostic logging, so it uses
 * isAcceptableMatch directly instead). */
export async function findPlaceImage(placeName: string, city: string): Promise<string | null> {
  const page = await searchWikipediaImage(`${placeName} ${city}`);
  return isAcceptableMatch(placeName, city, page) ? page.thumbnail.source : null;
}
