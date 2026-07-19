import { searchWikipediaImage, matchScore, type WikiPage } from "@/services/placeImageService";
import { collegeExists, createCollege } from "@/services/collegeService";
import { resolveCityAlias } from "@/lib/cityAliases";

/**
 * Grows the College catalog from what students actually type into the "Other (not listed)"
 * fallback on the college picker (profile-fields.tsx) — that field submits straight into the
 * same `college` string whether it was picked from the list or typed by hand, so this runs on
 * every profile save and simply no-ops once a name is already catalogued (see collegeExists).
 *
 * A typed name is only added once it's been verified against Wikipedia: real institutes are
 * near-universally documented there, and Wikipedia's own full-text search is loose enough that
 * trusting it blindly would let typos and made-up names into a catalog every future student
 * sees. Mirrors placeImageService.ts's own "verify before trusting" stance — see
 * isAcceptableCollegeMatch for the specific guards. A name that fails verification is simply
 * left alone (still saved as free text on that one student's own profile, same as before this
 * existed) rather than queued for admin review — there's no moderation/approval concept
 * anywhere else in this codebase to hook into, and the curated shortlist has always been
 * explicitly non-exhaustive (see College.ts's own comment), with admins able to add anything
 * missing by hand regardless.
 */

const MATCH_THRESHOLD = 0.75; // same bar placeImageService.ts uses for a photo match

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Same false-positive guards as placeImageService's isAcceptableMatch (names too short/generic
 * for full-text search to place reliably; an article that's really just about the city), minus
 * the thumbnail requirement — a college's Wikipedia article confirms it's real even without an
 * infobox photo. */
function isAcceptableCollegeMatch(name: string, city: string, page: WikiPage | null): page is WikiPage {
  if (!page) return false;
  if (tokenize(name).length < 2) return false;
  if (page.title.trim().toLowerCase() === city.trim().toLowerCase()) return false;
  return matchScore(name, page.title) >= MATCH_THRESHOLD;
}

async function verifyAndAddCollege(city: string, collegeCategoryId: string, name: string): Promise<void> {
  try {
    if (await collegeExists(city, collegeCategoryId, name)) return;

    const page = await searchWikipediaImage(`${name} ${city}`);
    if (!isAcceptableCollegeMatch(name, city, page)) return;

    // createCollege re-checks existence itself (city+category+slug) — if two students typed
    // the same new college name in quick succession, whichever verification finished first
    // wins and the other's `success: false` here is expected, not an error.
    const result = await createCollege({ city, collegeCategoryId, name });
    if (result.success) {
      console.log(`Auto-added college "${name}" (${city}) after Wikipedia verification (matched "${page.title}")`);
    }
  } catch (error) {
    console.error(`College verification failed for "${name}" in ${city}:`, error);
  }
}

/** Fire-and-forget — never awaited by callers, never throws (errors are logged and swallowed
 * inside verifyAndAddCollege). Same pattern as placeAutoFetchService.ensurePlacesForCity: called
 * synchronously but un-awaited from userService, so it never blocks the profile-save response. */
export function ensureCollegeExists(
  city: string | null | undefined,
  collegeCategoryId: string | null | undefined,
  name: string | null | undefined,
): void {
  if (!city || !collegeCategoryId || !name) return;
  void verifyAndAddCollege(resolveCityAlias(city.trim()), collegeCategoryId, name.trim());
}
