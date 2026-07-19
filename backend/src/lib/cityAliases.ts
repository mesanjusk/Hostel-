import { INDIAN_CITY_NAMES } from "@/lib/indianCities";

/** Case-insensitive city name -> canonical spelling (e.g. "mumbai" -> "Mumbai"), built from the
 * same curated list City/Place/College all key their `city` field on. */
const CANONICAL_CITY_BY_LOWERCASE = new Map(INDIAN_CITY_NAMES.map((name) => [name.toLowerCase(), name]));

/** Directional/administrative qualifier words that show up in India's official district names
 * (from the bulk district import into City — see City.state) but aren't part of the city name
 * itself, e.g. "Mumbai City", "Mumbai Suburban", "Bengaluru Urban", "North Goa", "East Delhi",
 * "Jaipur Rural", "Warangal Urban". Stripping these out of a "District, State" string and
 * checking what's left against the catalogued city names resolves the ~150 real districts that
 * happen to share a catalogued city's name — the other ~650 districts (e.g. "24 Parganas",
 * "Adilabad") genuinely don't correspond to any catalogued city and are correctly left
 * unresolved, since there's no city-specific Place/College data for them either. Verified against
 * the live City catalog (993 entries, 815 district-style) rather than assumed. */
const QUALIFIER_WORDS = new Set([
  "city",
  "urban",
  "suburban",
  "rural",
  "metropolitan",
  "division",
  "central",
  "north",
  "south",
  "east",
  "west",
  "new",
]);

/** Resolves a destination city string to the plain catalogued city name that Place.city and
 * College.city are actually keyed on. A plain name (or a string that doesn't match anything) is
 * returned unchanged; a "District, State" string is resolved by dropping the state and any
 * qualifier words from the district name, then matching what's left against the catalogued city
 * list. Without this, a user whose profile city is a district-style entry (e.g. "Ahmedabad,
 * Gujarat") would see an empty Explore page or an empty college list instead of the data already
 * catalogued under the plain city name. */
export function resolveCityAlias(city: string): string {
  const trimmed = city.trim();
  if (!trimmed) return city;

  const exact = CANONICAL_CITY_BY_LOWERCASE.get(trimmed.toLowerCase());
  if (exact) return exact;

  const districtPart = trimmed.split(",")[0]?.trim();
  if (!districtPart) return city;

  const core = districtPart
    .split(/\s+/)
    .filter((word) => !QUALIFIER_WORDS.has(word.toLowerCase()))
    .join(" ");

  return CANONICAL_CITY_BY_LOWERCASE.get(core.toLowerCase()) ?? city;
}
