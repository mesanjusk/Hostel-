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

const DEFAULT_BOY_SLUG_SET = new Set<string>(BOY_STICKER_SLUGS);

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

/** Admin-configured restriction of the boy sticker set (see the Gender Theme admin panel /
 * genderThemeService.ts) — populated once /api/gender-theme resolves. `null` means "no admin
 * override yet, use the full built-in BOY_STICKER_SLUGS set", which is also the safe state for
 * a cold/empty database or a failed fetch. */
let adminBoyStickerSlugs: Set<string> | null = null;

export function setAdminBoyStickerSlugs(slugs: string[] | null | undefined) {
  adminBoyStickerSlugs = slugs && slugs.length > 0 ? new Set(slugs) : null;
}

function girlDefaultSrc(slugOrPath: string): string {
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
 * - Male gets the boy SVG set: the slug's own boy art if it exists, else its mapped analog
 *   (GIRL_TO_BOY_SLUG), else — if neither exists or the admin has disabled it — the same girl
 *   .webp everyone else gets. Never a 404: every branch bottoms out at a file that exists.
 * - Female / Other / null / gender not yet known: today's exact girl .webp, byte for byte
 *   unchanged from before this feature existed.
 */
export function resolveStickerSrc(slugOrPath: string, gender: Gender | null | undefined): string {
  if (gender === "Male") {
    const enabled = adminBoyStickerSlugs ?? DEFAULT_BOY_SLUG_SET;
    const slug = extractGirlSlug(slugOrPath);
    if (slug) {
      const direct = enabled.has(slug) ? slug : null;
      const mapped = !direct && GIRL_TO_BOY_SLUG[slug] && enabled.has(GIRL_TO_BOY_SLUG[slug]) ? GIRL_TO_BOY_SLUG[slug] : null;
      const boySlug = direct ?? mapped;
      if (boySlug) return `/stickers/boy/${boySlug}.svg`;
    }
  }
  return girlDefaultSrc(slugOrPath);
}
