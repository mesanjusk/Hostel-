import type { Gender } from "@/types";

/** Base slugs (no extension) of every existing "girl" sticker under /stickers/*.webp — the
 * default set shown to Female/Other/null-gender users, unchanged from before this feature. Kept
 * here (rather than re-derived from a directory listing, which isn't possible client-side) so
 * the admin Gender Theme panel can offer the same list for its sticker toggle UI. */
export const GIRL_STICKER_SLUGS = [
  "alarm-clock",
  "bandaid-everything-okay",
  "bow",
  "bow-2",
  "budget-zero-stories-hero",
  "bunny-tulips",
  "camera",
  "cat-headphones-bubblegum",
  "charging-myself",
  "cherries",
  "choose-happy",
  "cookies",
  "cow-boba",
  "evil-eye",
  "extension-board",
  "good-things-coming",
  "headphones",
  "hostel-life-best-life",
  "laundry-again",
  "laundry-day",
  "maggi-therapy",
  "mess-food-survival-food",
  "midnight-maggi",
  "note-to-self",
  "okay-not-okay",
  "paise-khatam-emotion-khatam",
  "potted-plant",
  "room-518-legends",
  "sleep-is-overrated",
  "sleepy-moon",
  "small-steps-every-day",
  "trust-the-process",
  "tulips-bouquet",
  "you-matter",
] as const;

/** Base slugs (no extension) of every hand-drawn boy-theme sticker under /stickers/boy/*.svg.
 * Kept in sync with the files added in that folder. Referencing a slug that isn't in this list
 * from a male-themed surface is never a hard error — resolveStickerSrc just falls back to the
 * girl .webp for that slug, so a sticker can never 404. */
export const BOY_STICKER_SLUGS = [
  "soccer-ball",
  "basketball",
  "gamepad",
  "headphones-boy",
  "sneaker",
  "skateboard",
  "cap",
  "dumbbell",
  "rocket",
  "guitar",
  "trophy",
  "watch",
  "backpack-boy",
  "sunglasses",
  "football",
  "cricket-bat",
  "bike",
  "camera-boy",
  "boombox",
  "chess-piece",
  "dice",
  "compass",
  "medal",
  "thunderbolt",
  "target",
  "flame",
  "star-badge",
  "cloud-boy",
  "badge",
] as const;

/** Base slugs of the gamer-theme sticker set (raster crops the admin supplies, one file per
 * slug) added specifically for the Male survival guide — see GUIDE_GIRL_TO_BOY_SLUG below.
 * Listed separately from the original hand-drawn BOY_STICKER_SLUGS because these ship as
 * `/stickers/boy/<slug>.webp` (raster, see BOY_RASTER_SLUGS) rather than `.svg`. Still merged
 * into BOY_STICKER_SLUGS so they behave identically everywhere else a boy slug is valid (the
 * admin Gender Theme sticker picker, getStickerPool, DEFAULT_BOY_SLUG_SET). */
export const GUIDE_GAMER_STICKER_SLUGS = [
  "controller-white",
  "rockstar-star",
  "mortal-kombat-logo",
  "spiderman-hand",
  "one-up-pixel",
  "gaming-pc-rgb",
  "controller-blue-ps5",
  "game-over-pixel",
  "arcade-cabinet",
  "do-not-disturb-gamer",
  "gamer-zone-sign",
  "headset-gray",
  "soldier-with-cat",
  "chibi-gamer-boy",
  "nintendo-logo",
  "lightning-bird-logo",
  "green-triangle-badge",
  "ps-buttons-classic",
  "boo-ghost",
  "ps-buttons-dark",
  "uncharted-silhouette",
  "marvel-logo",
  "gta-logo",
  "red-dead-2-logo",
  "snes-controller",
  "real-madrid-jersey",
  "ghost-of-tsushima-red",
  "ghost-of-tsushima-blue",
  "playstation-family-logo",
] as const;

/** The 29 `.webp` files GUIDE_GAMER_STICKER_SLUGS points at were never uploaded to
 * /stickers/boy/ — every one 404s, and the browser renders the sticker's alt text in place of
 * the missing image. Flip to true once the admin has actually added those files; until then
 * resolveStickerSrc skips the guide-only mapping and falls back to the hand-drawn boy set. */
const GAMER_ASSETS_READY = false;

const DEFAULT_BOY_SLUG_SET = new Set<string>([...BOY_STICKER_SLUGS, ...GUIDE_GAMER_STICKER_SLUGS]);

/** Slugs whose boy art is a raster image (`.webp`) rather than the default hand-drawn `.svg` —
 * currently just the gamer set above. Consulted by boyStickerPath() so callers never have to
 * know which extension a given slug needs. */
const BOY_RASTER_SLUGS = new Set<string>(GUIDE_GAMER_STICKER_SLUGS);

/** Builds the on-disk path for a boy sticker slug, picking `.svg` or `.webp` per BOY_RASTER_SLUGS. */
export function boyStickerPath(slug: string): string {
  return `/stickers/boy/${slug}.${BOY_RASTER_SLUGS.has(slug) ? "webp" : "svg"}`;
}

/** Best-effort mapping from a girl-set slug (as used throughout home-elements-default.ts) to
 * its closest boy-set analog, for slugs that don't share the same base name (e.g. "bow" has no
 * literal boy equivalent, so it maps to "cap"). A slug not listed here just falls back to the
 * girl .webp when no boy art exists under that exact name — never a broken image. */
const GIRL_TO_BOY_SLUG: Record<string, string> = {
  camera: "camera-boy",
  headphones: "headphones-boy",
  "cat-headphones-bubblegum": "headphones-boy",
  bow: "cap",
  "bow-2": "sunglasses",
  cherries: "target",
  "evil-eye": "compass",
  "bunny-tulips": "skateboard",
  "tulips-bouquet": "rocket",
  "you-matter": "trophy",
  "okay-not-okay": "thunderbolt",
  "trust-the-process": "medal",
  "good-things-coming": "star-badge",
  "note-to-self": "badge",
  "bandaid-everything-okay": "dumbbell",
  "extension-board": "gamepad",
  "charging-myself": "boombox",
  "midnight-maggi": "dice",
  cookies: "chess-piece",
  "alarm-clock": "watch",
  "laundry-day": "bike",
  "laundry-again": "bike",
  "sleepy-moon": "cloud-boy",
  "sleep-is-overrated": "cloud-boy",
  "small-steps-every-day": "flame",
  "hostel-life-best-life": "trophy",
  "room-518-legends": "badge",
  "potted-plant": "guitar",
  "choose-happy": "soccer-ball",
  "mess-food-survival-food": "boombox",
  "maggi-therapy": "dice",
  "paise-khatam-emotion-khatam": "dumbbell",
  "budget-zero-stories-hero": "trophy",
};

/** Guide-only override of GIRL_TO_BOY_SLUG, consulted first (falling back to the general map)
 * when resolveStickerSrc is called with context: "guide" — i.e. only from the survival guide
 * page. Kept separate from GIRL_TO_BOY_SLUG so wiring the gamer set into the guide can't also
 * reskin the home/moodboard page's Male experience, which reuses several of the same girl slugs
 * (camera, bow, cherries, extension-board, etc.) at different, already-tuned positions. */
const GUIDE_GIRL_TO_BOY_SLUG: Record<string, string> = {
  camera: "controller-white",
  bow: "rockstar-star",
  "evil-eye": "mortal-kombat-logo",
  cherries: "spiderman-hand",
  "bandaid-everything-okay": "one-up-pixel",
  "extension-board": "gaming-pc-rgb",
  "charging-myself": "controller-blue-ps5",
  "laundry-again": "game-over-pixel",
  "laundry-day": "arcade-cabinet",
  "midnight-maggi": "do-not-disturb-gamer",
  cookies: "gamer-zone-sign",
  "maggi-therapy": "headset-gray",
  "mess-food-survival-food": "soldier-with-cat",
  "cat-headphones-bubblegum": "chibi-gamer-boy",
  "bow-2": "nintendo-logo",
  "small-steps-every-day": "lightning-bird-logo",
  "potted-plant": "green-triangle-badge",
  "alarm-clock": "ps-buttons-classic",
  "sleep-is-overrated": "boo-ghost",
  "sleepy-moon": "ps-buttons-dark",
  "cow-boba": "uncharted-silhouette",
  "choose-happy": "marvel-logo",
  "room-518-legends": "gta-logo",
  "budget-zero-stories-hero": "red-dead-2-logo",
  "paise-khatam-emotion-khatam": "snes-controller",
  "you-matter": "real-madrid-jersey",
  "bunny-tulips": "ghost-of-tsushima-red",
  "tulips-bouquet": "ghost-of-tsushima-blue",
  "hostel-life-best-life": "playstation-family-logo",
};

/** Admin-configured restriction of the boy sticker set (see the Gender Theme admin panel /
 * genderThemeService.ts) — populated once /api/gender-theme resolves. `null` means "no admin
 * override yet, use the full built-in BOY_STICKER_SLUGS set", which is also the safe state for
 * a cold/empty database or a failed fetch. */
let adminBoyStickerSlugs: Set<string> | null = null;

export function setAdminBoyStickerSlugs(slugs: string[] | null | undefined) {
  adminBoyStickerSlugs = slugs && slugs.length > 0 ? new Set(slugs) : null;
}

/** Admin-configured restriction of the girl sticker set, mirroring adminBoyStickerSlugs exactly.
 * Unlike the boy set, this is deliberately NOT consulted by resolveStickerSrc() — see the big
 * comment on getStickerPool() below for why — it only feeds the admin picker UI's "available"
 * list and the pool-based export for future generic sticker surfaces. */
let adminGirlStickerSlugs: Set<string> | null = null;

export function setAdminGirlStickerSlugs(slugs: string[] | null | undefined) {
  adminGirlStickerSlugs = slugs && slugs.length > 0 ? new Set(slugs) : null;
}

export interface CustomSticker {
  slug: string;
  url: string;
}

/** Admin-uploaded "add from device" stickers (see the Gender Theme admin panel), keyed by
 * gender — populated from /api/gender-theme alongside adminBoyStickerSlugs /
 * adminGirlStickerSlugs. Empty array (not null) is the safe default: nothing extra to add on
 * top of the built-in set. */
const adminCustomStickers: { Male: CustomSticker[]; Female: CustomSticker[] } = { Male: [], Female: [] };

export function setAdminCustomStickers(gender: "Male" | "Female", stickers: CustomSticker[] | null | undefined) {
  adminCustomStickers[gender] = stickers ?? [];
}

export function girlDefaultSrc(slugOrPath: string): string {
  return slugOrPath.startsWith("/stickers/") ? slugOrPath : `/stickers/${slugOrPath}.webp`;
}

/** Extracts the base slug from either a bare slug ("camera") or an already-built girl sticker
 * path ("/stickers/camera.webp"). Returns null for anything else (a custom admin-uploaded image
 * URL, a Cloudinary link, etc) — those are never gender-swapped, only ever passed through. */
function extractGirlSlug(slugOrPath: string): string | null {
  const match = slugOrPath.match(/^\/stickers\/([a-z0-9-]+)\.webp$/);
  if (match) return match[1];
  if (/^[a-z0-9-]+$/.test(slugOrPath)) return slugOrPath;
  return null;
}

/**
 * Resolves a sticker slug (or an already-built `/stickers/<slug>.webp` path) plus the viewer's
 * effective gender to the actual image path to render.
 *
 * - Male gets the boy set: the slug's own boy art if it exists, else its mapped analog (the
 *   guide-only map first when `context: "guide"`, then GIRL_TO_BOY_SLUG), else — if none of
 *   that exists or the admin has disabled it — the same girl image everyone else gets. Never a
 *   404: every branch bottoms out at a file that exists.
 * - Female / Other / null / gender not yet known: today's exact girl .webp, byte for byte
 *   unchanged from before this feature existed.
 */
export function resolveStickerSrc(
  slugOrPath: string,
  gender: Gender | null | undefined,
  context?: "guide",
): string {
  if (gender === "Male") {
    const enabled = adminBoyStickerSlugs ?? DEFAULT_BOY_SLUG_SET;
    const slug = extractGirlSlug(slugOrPath);
    if (slug) {
      const direct = enabled.has(slug) ? slug : null;
      const guideMapped =
        GAMER_ASSETS_READY &&
        context === "guide" &&
        GUIDE_GIRL_TO_BOY_SLUG[slug] &&
        enabled.has(GUIDE_GIRL_TO_BOY_SLUG[slug])
          ? GUIDE_GIRL_TO_BOY_SLUG[slug]
          : null;
      const mapped =
        !direct && !guideMapped && GIRL_TO_BOY_SLUG[slug] && enabled.has(GIRL_TO_BOY_SLUG[slug])
          ? GIRL_TO_BOY_SLUG[slug]
          : null;
      const boySlug = direct ?? guideMapped ?? mapped;
      if (boySlug) return boyStickerPath(boySlug);
    }
  }
  return girlDefaultSrc(slugOrPath);
}

const DEFAULT_GIRL_SLUG_SET = new Set<string>(GIRL_STICKER_SLUGS);

/**
 * Returns the full pool of stickers "available" for a gender: the admin-enabled built-in slugs
 * (or the full default set, if the admin hasn't restricted anything) plus any admin-uploaded
 * custom stickers, as {slug, url} pairs ready to render.
 *
 * SCOPING NOTE — deliberately NOT used by resolveStickerSrc() above: girl stickers today are
 * referenced as specific hardcoded slugs pinned to specific canvas positions (see
 * `stickerSlug: "cherries"` etc. in features/welcome/home-elements-default.ts). Unlike the Male
 * side — where an unmapped/disabled boy slug already has a designed, safe fallback straight to
 * the girl default, so nothing can ever break — there is no equivalent fallback for a pinned girl
 * slug: hiding or swapping it would just break that specific piece of already-placed content with
 * no safety net. So the Female allowlist (adminGirlStickerSlugs) and both genders' custom
 * stickers intentionally do NOT gate or alter what resolveStickerSrc() renders for a specific
 * requested slug on the Female/Other/null branch — that function keeps rendering the exact
 * requested girl slug unconditionally, exactly as it did before this pool existed. This pool is
 * only for NEW pool-based surfaces that pick from "whatever's available" rather than requesting a
 * specific pinned slug: the admin picker UI, and the already-exported-but-currently-unmounted
 * StickerField/Polaroid generic pool components in scrapbook-pieces.tsx, for whenever those get
 * wired into a live page. Retrofitting per-element slug swapping for Female is a larger feature,
 * deliberately out of scope here.
 */
export function getStickerPool(gender: Gender | null | undefined): CustomSticker[] {
  if (gender === "Male") {
    const enabled = adminBoyStickerSlugs ?? DEFAULT_BOY_SLUG_SET;
    const builtIn = [...enabled].map((slug) => ({ slug, url: boyStickerPath(slug) }));
    return [...builtIn, ...adminCustomStickers.Male];
  }
  const enabled = adminGirlStickerSlugs ?? DEFAULT_GIRL_SLUG_SET;
  const builtIn = [...enabled].map((slug) => ({ slug, url: `/stickers/${slug}.webp` }));
  return [...builtIn, ...adminCustomStickers.Female];
}
