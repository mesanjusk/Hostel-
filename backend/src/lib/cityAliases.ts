/** Maps the handful of Indian-district-style City catalog entries (added via a bulk district
 * import — see City.state) back to the plain city name that scripts/seedPlaces.ts's curated data
 * and placeAutoFetchService's auto-fetch pipeline actually key Place.city on. Without this, a
 * user who picked one of these district variants as their destination city sees an empty Explore
 * page instead of the already-curated places for their city, and auto-fetch would build a second,
 * lower-quality OSM-only place list under the district string instead of reusing/supplementing
 * the curated one.
 *
 * Deliberately a short, hand-verified list — one entry per curated city (scripts/seedPlaces.ts)
 * that also has a same-city district import, not a general-purpose district→city normalizer for
 * the full ~800-entry district catalog. Manipal has no matching district entry (it's a town
 * within Udupi district, not a district itself), so it isn't listed here. Delhi's district import
 * uses the same plain "Delhi" name, so it needs no alias either.
 */
const CITY_ALIASES: Record<string, string> = {
  "mumbai city, maharashtra": "Mumbai",
  "mumbai suburban, maharashtra": "Mumbai",
  "bengaluru urban, karnataka": "Bengaluru",
  "bengaluru north, karnataka": "Bengaluru",
  "bengaluru south, karnataka": "Bengaluru",
  "bengaluru, karnataka": "Bengaluru",
  "chennai, tamil nadu": "Chennai",
  "kolkata, west bengal": "Kolkata",
  "hyderabad, telangana": "Hyderabad",
  "pune, maharashtra": "Pune",
  "ahmedabad, gujarat": "Ahmedabad",
  "jaipur, rajasthan": "Jaipur",
  "jaipur rural, rajasthan": "Jaipur",
  "lucknow, uttar pradesh": "Lucknow",
  "chandigarh, chandigarh": "Chandigarh",
  "indore, madhya pradesh": "Indore",
  "nagpur, maharashtra": "Nagpur",
  "kota, rajasthan": "Kota",
  "dehradun, uttarakhand": "Dehradun",
  "bhopal, madhya pradesh": "Bhopal",
  "vadodara, gujarat": "Vadodara",
  "coimbatore, tamil nadu": "Coimbatore",
  "vellore, tamil nadu": "Vellore",
};

/** Case-insensitive; returns the canonical curated city name for a known district alias, or
 * `city` unchanged if it isn't one. */
export function resolveCityAlias(city: string): string {
  return CITY_ALIASES[city.trim().toLowerCase()] ?? city;
}
