import { connectDB } from "@/db";
import { User } from "@/models/User";
import { WaPendingRegistration } from "@/models/WaPendingRegistration";
import { normalizeMobile } from "@/lib/phone";
import { hashPin, verifyPin } from "@/lib/pin";
import { signAuthToken } from "@/lib/jwt";
import { serializeUser } from "@/lib/serialize";

const PENDING_TTL_MS = 30 * 60 * 1000;
const RESTART_COOLDOWN_MS = 15 * 1000;

export class WaRegisterCooldownError extends Error {}

/** Starts (or restarts) a pending /wa-login registration handshake. Does not touch the User
 * collection — the account is only created once the matching WhatsApp message arrives. */
export async function startPendingRegistration(mobile: string, pin: string) {
  await connectDB();

  const existingUser = await User.findOne({ mobile }).lean();
  if (existingUser) {
    return { success: false as const, error: "An account with this mobile number already exists. Try logging in instead." };
  }

  const recent = await WaPendingRegistration.findOne({ mobile }).sort({ createdAt: -1 });
  if (recent && recent.status === "pending" && Date.now() - recent.createdAt.getTime() < RESTART_COOLDOWN_MS) {
    throw new WaRegisterCooldownError("Please wait a moment before trying again");
  }

  await WaPendingRegistration.deleteMany({ mobile });

  const pinHash = await hashPin(pin);
  const pending = await WaPendingRegistration.create({
    mobile,
    pinHash,
    status: "pending",
    expiresAt: new Date(Date.now() + PENDING_TTL_MS),
  });

  return { success: true as const, pendingId: pending._id.toString() };
}

export async function getRegistrationStatus(pendingId: string) {
  await connectDB();

  const pending = await WaPendingRegistration.findById(pendingId);
  if (!pending) {
    return { status: "expired" as const };
  }

  if (pending.status === "pending") {
    return { status: "pending" as const };
  }

  const user = pending.resultUserId ? await User.findById(pending.resultUserId) : null;
  if (!user) {
    return { status: "expired" as const };
  }

  const token = signAuthToken(user._id.toString());
  return {
    status: "registered" as const,
    token,
    user: serializeUser(user),
    suggestedName: pending.suggestedName ?? null,
  };
}

/**
 * Completes a registration from an inbound WhatsApp message. `verifiedMobile` is the actual
 * WhatsApp sender number (from the webhook payload) — the source of truth for identity, since
 * only that number's own WhatsApp account can send from it. `typedMobile`/`pin` come from
 * parsing the message text ("Register me as <mobile>, my PIN is <pin>"); typedMobile must match
 * verifiedMobile so a visitor can't hijack someone else's pending handshake by guessing/knowing
 * their PIN and sending from a different number.
 */
export async function completeRegistrationFromWhatsApp(
  verifiedMobile: string,
  typedMobile: string,
  pin: string,
  profileName: string | null,
): Promise<boolean> {
  await connectDB();

  const normalizedVerified = normalizeMobile(verifiedMobile);
  const normalizedTyped = normalizeMobile(typedMobile);
  if (!normalizedVerified || !normalizedTyped || normalizedVerified !== normalizedTyped) {
    return false;
  }

  const existingUser = await User.findOne({ mobile: normalizedVerified }).lean();
  if (existingUser) {
    return false;
  }

  const pending = await WaPendingRegistration.findOne({ mobile: normalizedVerified, status: "pending" }).sort({
    createdAt: -1,
  });
  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    return false;
  }

  const pinMatches = await verifyPin(pin, pending.pinHash);
  if (!pinMatches) {
    return false;
  }

  const user = await User.create({ mobile: normalizedVerified, role: "student", loginPinHash: pending.pinHash });

  pending.status = "registered";
  pending.resultUserId = user._id;
  pending.suggestedName = profileName;
  await pending.save();

  return true;
}
