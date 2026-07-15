// Small built-in list — enough to catch the common cases without shipping a third-party
// wordlist dependency. Deliberately conservative (whole-word match) to avoid false positives
// on legitimate words that merely contain a substring.
const PROFANITY_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "slut", "whore", "nigger", "faggot", "cunt",
  "randi", "chutiya", "madarchod", "behenchod", "bhosdike", "gandu", "harami",
];

const PROFANITY_REGEX = new RegExp(`\\b(${PROFANITY_WORDS.join("|")})\\b`, "gi");
const URL_REGEX = /\bhttps?:\/\/[^\s]+/gi;

/** Escapes HTML-significant characters so a message body can never be interpreted as markup —
 * the chat renders messages as plain text, so this is the only sanitization a client needs. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Masks profane words with asterisks, preserving the word's length. */
export function censorProfanity(value: string): string {
  return value.replace(PROFANITY_REGEX, (match) => match[0] + "*".repeat(match.length - 1));
}

export function containsProfanity(value: string): boolean {
  PROFANITY_REGEX.lastIndex = 0;
  return PROFANITY_REGEX.test(value);
}

export function extractLinks(value: string): string[] {
  return value.match(URL_REGEX) ?? [];
}

/** Extracts @username mentions from a message body — usernames are lowercase alnum/underscore
 * per lib/username.ts's format, so this pattern matches exactly what can ever be a valid handle. */
export function extractMentionedUsernames(value: string): string[] {
  const matches = value.match(/@([a-z0-9_]{3,32})\b/gi) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

const MAX_MESSAGE_LENGTH = 4000;

/** Cleans a raw message body for storage: trims, caps length, escapes HTML, and censors
 * built-in profanity. Rejects (returns null) anything that's empty after trimming. */
export function sanitizeMessageBody(raw: string): string | null {
  const trimmed = raw.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!trimmed) return null;
  return censorProfanity(escapeHtml(trimmed));
}
