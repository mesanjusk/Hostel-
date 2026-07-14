import { connectDB } from "@/db";
import { User } from "@/models/User";
import { normalizeMobile } from "@/lib/phone";
import { verifyPin } from "@/lib/pin";

const MAX_ATTEMPTS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export class RateLimitedError extends Error {}

/**
 * Verifies a mobile+login-code login. This never creates a user — the account must already
 * exist, either admin-provisioned (7-digit code), self-registered via WhatsApp OTP (the
 * verified 6-digit code becomes the login code), or self-registered via the /wa-login PIN
 * flow (a 4-digit code the visitor chose), so valid codes can be any of those lengths.
 *
 * Rate-limit state lives on the User document itself (a trimmed array of attempt timestamps)
 * rather than a dedicated collection.
 */
export async function authenticateWithPin(rawMobile: string, pin: string) {
  await connectDB();

  const mobile = normalizeMobile(rawMobile);
  if (!mobile) {
    return null;
  }

  const user = await User.findOne({ mobile });

  if (!user) {
    return null;
  }

  const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
  const recentAttempts = (user.loginAttempts ?? []).filter((at) => at.getTime() >= windowStart);

  if (recentAttempts.length >= MAX_ATTEMPTS_PER_WINDOW) {
    throw new RateLimitedError("Too many attempts. Please try again in a few minutes.");
  }

  async function recordAttempt() {
    user!.loginAttempts = [...recentAttempts, new Date()];
    await user!.save();
  }

  if (!user.loginPinHash) {
    await recordAttempt();
    return null;
  }

  if (!/^\d{4,7}$/.test(pin)) {
    await recordAttempt();
    return null;
  }

  const isValid = await verifyPin(pin, user.loginPinHash);
  await recordAttempt();

  if (!isValid) {
    return null;
  }

  return user;
}
