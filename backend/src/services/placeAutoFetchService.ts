import { connectDB } from "@/db";
import { Place } from "@/models/Place";
import { PlaceCityFetch } from "@/models/PlaceCityFetch";
import { escapeRegex } from "@/lib/regex";
import { findPlaceImage, sleep, WIKI_REQUEST_DELAY_MS } from "@/services/placeImageService";
import type { PlaceCategory } from "@/types";

/**
 * Fills the Place collection for a city the moment a user's profile first names it, so Explore
 * isn't empty for whoever gets there next. Runs for every city, including seedPlaces.ts's 20
 * hand-curated ones — a curated city just starts from a non-empty set of names to skip.
 * Whatever's already on file (curated or previously auto-fetched) always takes precedence:
 * this only ever adds names that don't already exist in that city, never touches or replaces an
 * existing doc. Runs at most once per city ever, tracked via PlaceCityFetch — not gated on
 * "does this city have Place docs" (curated cities already do, on day one), so a separate record
 * of "has the OSM pass itself already run here" is what actually prevents re-scanning Mumbai on
 * every single Mumbai profile save.
 *
 * Source: OpenStreetMap (Nominatim for geocoding, Overpass for venues near that point) — free,
 * keyless, no billing to set up. Unlike seedPlaces.ts's "nothing invented" curation, `rating`,
 * `openingHours` and `description` are left unset here too (same reasoning: OSM's
 * `opening_hours` is a compact machine syntax, not something to surface unparsed as if it were
 * human-written copy, and there's no rating data to draw from without a paid API). Data quality
 * is rougher than the curated cities — expect solid tourist spots/temples/stations, and
 * thinner/occasionally-missing restaurant and shop coverage. "Nearby Attraction" is deliberately
 * never populated here — that category is for admin-picked day trips outside the city, not
 * something to infer from a radius query.
 *
 * Once the venues themselves are saved, a second pass (backfillImagesForCity) looks up a display
 * photo for each one via placeImageService — the same Wikipedia-matching logic
 * scripts/fetchPlaceImages.ts already used for manual/admin backfills, just triggered
 * automatically here instead of by hand. Runs after the bulkWrite, in the same background task,
 * so a slow or failed image lookup never affects whether the places themselves get saved.
 */

const NOMINATIM_USER_AGENT = "PackWithMe-PlaceAutoFetch/1.0 (+https://packwithme.instify.in)";
// Public, keyless mirrors — tried in order. overpass-api.de (the reference instance) 504s under
// its own load fairly often; kumi.systems is the standard fallback the OSM community points to.
const OVERPASS_ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const MAX_PER_CATEGORY = 8;

interface TagRule {
  key: string;
  value: string;
  category: PlaceCategory;
}

// Ordered by nothing in particular — categorize() scans the full list, so order doesn't affect
// results. Deliberately excludes anything OSM tags too inconsistently to trust (e.g. street
// vendors have no reliable tag, so "Street Food" borrows amenity=fast_food as the closest fit).
const TAG_RULES: TagRule[] = [
  { key: "tourism", value: "attraction", category: "Tourist Place" },
  { key: "tourism", value: "museum", category: "Tourist Place" },
  { key: "tourism", value: "viewpoint", category: "Tourist Place" },
  { key: "tourism", value: "zoo", category: "Tourist Place" },
  { key: "tourism", value: "theme_park", category: "Tourist Place" },
  { key: "leisure", value: "park", category: "Park" },
  { key: "amenity", value: "restaurant", category: "Restaurant" },
  { key: "amenity", value: "fast_food", category: "Street Food" },
  { key: "amenity", value: "cafe", category: "Cafe" },
  { key: "shop", value: "mall", category: "Shopping" },
  { key: "shop", value: "supermarket", category: "Shopping" },
  { key: "shop", value: "department_store", category: "Shopping" },
  { key: "amenity", value: "hospital", category: "Medical" },
  { key: "amenity", value: "clinic", category: "Medical" },
  { key: "amenity", value: "pharmacy", category: "Medical" },
  { key: "railway", value: "station", category: "Station" },
  { key: "aeroway", value: "aerodrome", category: "Airport" },
  { key: "amenity", value: "bank", category: "Bank" },
  { key: "amenity", value: "atm", category: "ATM" },
  { key: "shop", value: "laundry", category: "Laundry" },
  { key: "leisure", value: "fitness_centre", category: "Gym" },
  { key: "amenity", value: "library", category: "Library" },
  { key: "amenity", value: "marketplace", category: "Market" },
];

// Query clauses grouped by (osm key, search radius) using tag alternation, rather than one
// clause per tag value — a first version issued 23 separate `around:` spatial filters and the
// public Overpass instance reliably 504'd on it. Grouping same-radius same-key rules into one
// regex-alternation clause cuts that to a handful of clauses, which is what actually made this
// reliable. categorize() below still inspects each returned element's own tags individually, so
// this grouping has no effect on which category an element lands in.
const CLAUSE_GROUPS: Array<{ key: string; values: string[]; radiusM: number }> = [
  { key: "amenity", values: ["restaurant", "fast_food", "cafe", "bank", "atm"], radiusM: 4000 },
  { key: "shop", values: ["supermarket", "department_store", "laundry"], radiusM: 4000 },
  { key: "leisure", values: ["fitness_centre"], radiusM: 4000 },
  { key: "tourism", values: ["attraction", "museum", "viewpoint"], radiusM: 8000 },
  { key: "leisure", values: ["park"], radiusM: 8000 },
  { key: "shop", values: ["mall"], radiusM: 8000 },
  { key: "amenity", values: ["hospital", "clinic", "pharmacy", "library", "marketplace", "place_of_worship"], radiusM: 8000 },
  { key: "tourism", values: ["zoo", "theme_park"], radiusM: 15000 },
  { key: "railway", values: ["station"], radiusM: 12000 },
  { key: "aeroway", values: ["aerodrome"], radiusM: 20000 },
];

/** Cities currently being fetched, so two users naming the same brand-new city moments apart
 * don't fire two Overpass queries. Per-process only — fine here since the DB existence check
 * this guards is itself idempotent; worst case of a missed race is one redundant fetch. */
const inFlightCities = new Set<string>();

/** Mirrors seedPlaces.ts's own maps() helper — same URL shape, same reasoning (a search link
 * never 404s and always resolves to current hours/reviews). */
function mapsSearchLink(name: string, city: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`;
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [tags["addr:suburb"] || tags["addr:neighbourhood"], tags["addr:street"]].filter(Boolean);
  return parts.join(", ");
}

function categorize(tags: Record<string, string>): PlaceCategory | null {
  if (tags.amenity === "place_of_worship") {
    const religion = tags.religion;
    if (religion === "muslim") return "Mosque";
    if (religion === "christian") return "Church";
    // Our fixed category list has no gurdwara/vihara/mandir distinction — grouped under the
    // closest existing category rather than dropped.
    if (religion === "hindu" || religion === "jain" || religion === "buddhist" || religion === "sikh") return "Temple";
    return null;
  }
  return TAG_RULES.find((rule) => tags[rule.key] === rule.value)?.category ?? null;
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&country=India&city=${encodeURIComponent(city)}`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim request failed: ${res.status}`);
  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  const first = results[0];
  return first ? { lat: Number(first.lat), lon: Number(first.lon) } : null;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  tags?: Record<string, string>;
}

function buildOverpassQuery(lat: number, lon: number): string {
  const clauses = CLAUSE_GROUPS.map(
    (group) => `  nwr["${group.key}"~"^(${group.values.join("|")})$"](around:${group.radiusM},${lat},${lon});`,
  ).join("\n");
  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout tags;`;
}

async function queryOverpass(lat: number, lon: number): Promise<OverpassElement[]> {
  const query = buildOverpassQuery(lat, lon);
  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "User-Agent": NOMINATIM_USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) throw new Error(`Overpass request to ${endpoint} failed: ${res.status}`);
      const data = (await res.json()) as { elements?: OverpassElement[] };
      return data.elements ?? [];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Best-effort: looks up a Wikipedia photo for each newly-inserted place, one at a time with a
 * politeness delay between requests (same pacing scripts/fetchPlaceImages.ts uses). A single
 * place's lookup failing just skips that place — never aborts the rest of the batch. */
async function backfillImagesForCity(city: string, names: string[]): Promise<void> {
  let matched = 0;
  for (const name of names) {
    try {
      const imageUrl = await findPlaceImage(name, city);
      if (imageUrl) {
        await Place.updateOne({ city, name, imageUrl: null }, { imageUrl });
        matched += 1;
      }
    } catch (error) {
      console.error(`[placeAutoFetch] image lookup failed for "${name}" (${city}):`, error);
    }
    await sleep(WIKI_REQUEST_DELAY_MS);
  }
  console.log(`[placeAutoFetch] added images for ${matched}/${names.length} place(s) in "${city}"`);
}

async function autoFetchPlacesForCity(city: string): Promise<void> {
  const trimmed = city.trim();
  if (!trimmed) return;
  const key = trimmed.toLowerCase();
  if (inFlightCities.has(key)) return;
  inFlightCities.add(key);

  try {
    await connectDB();
    const cityFilter = new RegExp(`^${escapeRegex(trimmed)}$`, "i");
    const alreadyFetched = await PlaceCityFetch.exists({ city: cityFilter });
    if (alreadyFetched) return;

    const location = await geocodeCity(trimmed);
    if (!location) {
      // Transient/config problem, not "nothing here" — no PlaceCityFetch record written, so a
      // later profile save for this city gets to try again instead of being skipped forever.
      console.warn(`[placeAutoFetch] could not geocode "${trimmed}" — skipping`);
      return;
    }

    // Existing names in this city — curated (seedPlaces.ts), previously auto-fetched, or
    // admin-added — take precedence over anything OSM finds. Seeding seenNames with these means
    // an OSM element sharing a name with one is silently dropped rather than considered "new",
    // so nothing already on file is ever duplicated or touched.
    const existing = await Place.find({ city: cityFilter }).select("name").lean();
    const existingNames = existing.map((p) => p.name);
    const seenNames = new Set(existingNames.map((n) => n.trim().toLowerCase()));

    const elements = await queryOverpass(location.lat, location.lon);

    const byCategory = new Map<PlaceCategory, OverpassElement[]>();
    for (const el of elements) {
      const name = el.tags?.name?.trim();
      if (!name || seenNames.has(name.toLowerCase())) continue;
      const category = el.tags ? categorize(el.tags) : null;
      if (!category) continue;
      const bucket = byCategory.get(category) ?? [];
      if (bucket.length >= MAX_PER_CATEGORY) continue;
      bucket.push(el);
      byCategory.set(category, bucket);
      seenNames.add(name.toLowerCase());
    }

    const operations = [...byCategory.entries()].flatMap(([category, els]) =>
      els.map((el) => {
        const name = el.tags!.name!.trim();
        return {
          updateOne: {
            filter: { city: trimmed, name },
            update: {
              $setOnInsert: {
                city: trimmed,
                category,
                name,
                address: buildAddress(el.tags!),
                mapsLink: mapsSearchLink(name, trimmed),
                description: "",
                rating: null,
                imageUrl: null,
                openingHours: "",
                featured: false,
              },
            },
            upsert: true,
          },
        };
      }),
    );

    if (operations.length === 0) {
      console.log(
        `[placeAutoFetch] no new places for "${trimmed}" beyond the ${existingNames.length} already on file`,
      );
    } else {
      await Place.bulkWrite(operations);
      console.log(
        `[placeAutoFetch] added ${operations.length} new place(s) for "${trimmed}" from OpenStreetMap ` +
          `(${existingNames.length} already on file were left untouched)`,
      );

      const insertedNames = operations.map((op) => op.updateOne.filter.name);
      try {
        await backfillImagesForCity(trimmed, insertedNames);
      } catch (error) {
        // Never let a failed image pass look like the place-seeding itself failed — the places
        // above are already saved regardless of what happens here.
        console.error(`[placeAutoFetch] image backfill failed for "${trimmed}":`, error);
      }
    }

    // Written only once the OSM pass genuinely completed (whether or not it found anything new)
    // — this, not Place data, is what stops "${trimmed}" from being re-scanned on every future
    // profile save naming it.
    await PlaceCityFetch.updateOne(
      { city: cityFilter },
      { $setOnInsert: { city: trimmed, placesAdded: operations.length } },
      { upsert: true },
    );
  } catch (error) {
    console.error(`[placeAutoFetch] failed for "${trimmed}":`, error);
  } finally {
    inFlightCities.delete(key);
  }
}

/** Fire-and-forget: call whenever a user's city is set/changed. Never throws, never blocks the
 * caller — safe to call on every profile save regardless of whether the city actually changed,
 * since the cheap indexed existence check above is what actually gates any network call. */
export function ensurePlacesForCity(city: string | null | undefined): void {
  if (!city) return;
  void autoFetchPlacesForCity(city);
}
