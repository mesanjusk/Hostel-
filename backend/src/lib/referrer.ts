export type ReferralSource =
  | "direct"
  | "google"
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "linkedin"
  | "other";

const HOST_MAP: { pattern: RegExp; source: ReferralSource }[] = [
  { pattern: /(^|\.)google\./i, source: "google" },
  { pattern: /(^|\.)facebook\.com$|(^|\.)fb\.com$/i, source: "facebook" },
  { pattern: /(^|\.)instagram\.com$/i, source: "instagram" },
  { pattern: /(^|\.)whatsapp\.com$/i, source: "whatsapp" },
  { pattern: /(^|\.)linkedin\.com$/i, source: "linkedin" },
];

/** Classifies a raw `document.referrer` (or empty string for direct traffic) into one of the
 * known referral buckets. UTM source, when present, always wins — see `resolveReferralSource`. */
function classifyReferrer(referrer: string | null | undefined): ReferralSource {
  if (!referrer) return "direct";

  try {
    const host = new URL(referrer).hostname;
    for (const { pattern, source } of HOST_MAP) {
      if (pattern.test(host)) return source;
    }
    return "other";
  } catch {
    return "other";
  }
}

/** UTM `source`/`medium` take priority over the raw referrer when present — a link tagged
 * `utm_source=facebook` should count as Facebook even if it was opened via an in-app browser
 * that strips or rewrites `document.referrer`. */
export function resolveReferralSource(referrer: string | null | undefined, utmSource: string | null | undefined): ReferralSource {
  if (utmSource) {
    const normalized = utmSource.toLowerCase();
    if (normalized.includes("google")) return "google";
    if (normalized.includes("facebook") || normalized === "fb") return "facebook";
    if (normalized.includes("instagram") || normalized === "ig") return "instagram";
    if (normalized.includes("whatsapp")) return "whatsapp";
    if (normalized.includes("linkedin")) return "linkedin";
    return "other";
  }
  return classifyReferrer(referrer);
}
