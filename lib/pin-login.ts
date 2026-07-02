import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { normalizeMobile } from "@/lib/phone";
import { verifyPin } from "@/lib/pin";

const MAX_ATTEMPTS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export class RateLimitedError extends Error {}

/**
 * Verifies an admin-issued mobile+PIN login. Unlike the WhatsApp ticket flow, this never
 * creates a user — the account must already exist (admin-provisioned) with a PIN set.
 *
 * Rate-limit state lives on the User document itself (a trimmed array of attempt timestamps)
 * rather than a dedicated collection, since the Atlas cluster is at its collection cap. This
 * means attempts against a mobile number with no matching user aren't rate-limited — there's
 * no document to hold that state — but that lookup is a cheap no-op anyway.
 */
export async function authenticateWithPin(rawMobile: string, pin: string) {
  await connectDB();

  const mobile = normalizeMobile(rawMobile);
  if (!mobile) {
    console.error("[pin-login] rejected: raw mobile didn't normalize", { rawMobile });
    return null;
  }

  const user = await User.findOne({ mobile });

  if (!user) {
    console.error("[pin-login] rejected: no user for mobile", { mobile });
    return null;
  }

  const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
  const recentAttempts = (user.loginAttempts ?? []).filter((at) => at.getTime() >= windowStart);

  if (recentAttempts.length >= MAX_ATTEMPTS_PER_WINDOW) {
    console.error("[pin-login] rate limited", { mobile });
    throw new RateLimitedError("Too many attempts. Please try again in a few minutes.");
  }

  async function recordAttempt() {
    user!.loginAttempts = [...recentAttempts, new Date()];
    await user!.save();
  }

  if (!user.loginPinHash) {
    console.error("[pin-login] rejected: user has no loginPinHash set", { mobile });
    await recordAttempt();
    return null;
  }

  if (!/^\d{7}$/.test(pin)) {
    console.error("[pin-login] rejected: submitted pin isn't 7 digits", { mobile, pinLength: pin.length });
    await recordAttempt();
    return null;
  }

  const isValid = await verifyPin(pin, user.loginPinHash);
  await recordAttempt();

  if (!isValid) {
    console.error("[pin-login] rejected: pin didn't match hash", { mobile });
    return null;
  }

  return user;
}
