/**
 * Backfills `imageUrl` on existing Place documents that don't have one, using real photos
 * from Wikipedia/Wikimedia Commons — no invented or stock-generic images.
 *
 * Why Wikipedia and not a stock-photo API: it's free, needs no API key, and each result is
 * tied to an actual article, so a match can be verified against the place name instead of
 * trusted blindly. Wikipedia's own full-text search is loose though — searching for a small
 * local eatery can return an unrelated but topically-similar article (e.g. a generic dish
 * page) with its own photo, which would misrepresent that place. So every candidate is
 * title-matched against the place name (normalized word overlap) and rejected below a
 * threshold rather than attached speculatively. In practice this means well-documented
 * landmarks/temples/parks get real photos and small local restaurants/stalls mostly don't —
 * consistent with seedPlaces.ts's existing "nothing invented" stance; add those manually via
 * the admin Places editor instead.
 *
 * Only fills places where imageUrl is currently null — never overwrites an image an admin has
 * already set. Safe to re-run; already-filled places are skipped on subsequent runs.
 *
 * A place is only ever looked up once by default: every place processed here (matched, or
 * skipped as too weak a match) gets `imageLookupAttemptedAt` stamped, and the default query
 * only picks up places that have never been attempted. Without this, a place Wikipedia has no
 * good article for (most small local restaurants/stalls) would get re-queried — and re-charged
 * its ~1.2s rate-limit delay — on every run forever. `--retry-attempted` opts back into
 * re-checking those (e.g. after Wikipedia coverage improves). A place that errors (network
 * blip, etc.) is deliberately NOT stamped, so it's retried on the next run either way.
 *
 * `--limit` bounds how many places one run processes, so a large backlog (e.g. right after a
 * bulk city import) doesn't turn a single run into a multi-minute one — it drains a bit more of
 * the backlog on every subsequent run instead.
 *
 * Usage:
 *   npm run images:places                     # fill up to --limit never-attempted places
 *   npm run images:places -- --limit=200       # override the default per-run cap
 *   npm run images:places -- --dry-run         # preview matches/rejections, write nothing
 *   npm run images:places -- --city=Delhi      # limit to one city (matches seedPlaces.ts spelling)
 *   npm run images:places -- --retry-attempted # also re-check places already attempted before
 */
import "dotenv/config";
import mongoose from "mongoose";

import { Place } from "@/models/Place";
import {
  WIKI_REQUEST_DELAY_MS as REQUEST_DELAY_MS,
  isAcceptableMatch,
  matchScore,
  searchWikipediaImage,
  sleep,
  type WikiPage,
} from "@/services/placeImageService";

const DEFAULT_LIMIT = 75;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const retryAttempted = args.includes("--retry-attempted");
  const cityArg = args.find((a) => a.startsWith("--city="))?.split("=")[1];
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? Number(limitArg) : DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error(`--limit must be a positive integer, got "${limitArg}"`);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  const filter: Record<string, unknown> = { imageUrl: null };
  if (!retryAttempted) filter.imageLookupAttemptedAt = null;
  if (cityArg) filter.city = new RegExp(`^${cityArg}$`, "i");

  const places = await Place.find(filter).sort({ city: 1, name: 1 }).limit(limit);
  console.log(
    `${places.length} place(s) missing an image${cityArg ? ` in ${cityArg}` : ""} (limit ${limit}${retryAttempted ? ", including previously-attempted" : ""})${dryRun ? " — dry run" : ""}\n`,
  );

  let matched = 0;
  let skipped = 0;

  for (const place of places) {
    const query = `${place.name} ${place.city}`;
    let page: WikiPage | null = null;
    try {
      page = await searchWikipediaImage(query);
    } catch (error) {
      console.log(`  ERROR  ${query} — ${(error as Error).message}`);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    const score = page ? matchScore(place.name, page.title) : 0;
    const accept = isAcceptableMatch(place.name, place.city, page);

    if (accept && page?.thumbnail) {
      console.log(`  MATCH  ${query} -> "${page.title}" (score ${score.toFixed(2)})`);
      matched += 1;
      if (!dryRun) {
        await Place.updateOne(
          { _id: place._id, imageUrl: null },
          { imageUrl: page.thumbnail.source, imageLookupAttemptedAt: new Date() },
        );
      }
    } else {
      console.log(`  skip   ${query}${page ? ` (closest: "${page.title}", score ${score.toFixed(2)})` : " (no result)"}`);
      skipped += 1;
      // Stamped even on a skip (not just a match) — this is what stops a place with no good
      // Wikipedia article from being re-queried, and re-charged its rate-limit delay, forever.
      if (!dryRun) {
        await Place.updateOne({ _id: place._id }, { imageLookupAttemptedAt: new Date() });
      }
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\n${matched} matched${dryRun ? " (not written — dry run)" : ""}, ${skipped} skipped out of ${places.length}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
