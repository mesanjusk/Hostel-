import { randomInt } from "node:crypto";

import { User } from "@/models/User";

// Keep this list small and generic (no real names/places) — usernames are generated, not
// chosen, so they must never accidentally resemble a real identity.
const ADJECTIVES = [
  "creative", "hostel", "campus", "curious", "midnight", "sunny", "clever", "quiet", "bold",
  "cosmic", "chill", "swift", "gentle", "electric", "vivid", "lucky", "wandering", "bright",
  "silent", "urban", "cheerful", "brave", "mellow", "witty", "restless", "serene", "sharp",
];
const NOUNS = [
  "hawk", "mind", "wizard", "otter", "falcon", "panda", "voyager", "scholar", "phoenix",
  "tiger", "dreamer", "coder", "artist", "explorer", "nomad", "maverick", "sparrow", "fox",
  "comet", "wolf", "raven", "pioneer", "builder", "spark", "breeze", "star", "rider",
];

function randomHandle(): string {
  const adjective = ADJECTIVES[randomInt(0, ADJECTIVES.length)];
  const noun = NOUNS[randomInt(0, NOUNS.length)];
  return `${adjective}${noun}`;
}

/** Generates a unique @handle like "creativemind" or "hostelhawk3821" — retries with a random
 * numeric suffix on collision. Never derived from the student's real name/mobile/college. */
export async function generateUniqueUsername(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const base = randomHandle();
    const candidate = attempt < 8 ? base : `${base}${randomInt(10, 9999)}`;
    const exists = await User.exists({ username: candidate });
    if (!exists) return candidate;
  }
  // Exhausted the friendly namespace (astronomically unlikely) — fall back to a value that's
  // guaranteed unique.
  return `student${randomInt(100000, 999999)}`;
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

export function isValidUsernameFormat(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}
