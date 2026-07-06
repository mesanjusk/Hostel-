import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

import { connectDB } from "@/db";
import { OtpVerification } from "@/models/OtpVerification";
import { sendWhatsAppOtp } from "@/lib/whatsapp";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

export type OtpPurpose = "register" | "reset";

export class OtpCooldownError extends Error {}

function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

/** Creates and WhatsApp-sends a fresh 6-digit code, replacing any prior unused code
 * for the same mobile+purpose. In non-production, the code is also returned as
 * `devOtp` so registration/reset can be tested without a live WhatsApp send. */
export async function requestOtp(mobile: string, purpose: OtpPurpose) {
  await connectDB();

  const recent = await OtpVerification.findOne({ mobile, purpose }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new OtpCooldownError("Please wait a moment before requesting another code");
  }

  await OtpVerification.deleteMany({ mobile, purpose });

  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await OtpVerification.create({ mobile, purpose, codeHash, expiresAt });

  let sent = false;
  let error: string | null = null;
  try {
    await sendWhatsAppOtp(mobile, code);
    sent = true;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to send OTP";
    console.error("[OTP] WhatsApp send error:", error);
  }

  const devOtp = process.env.NODE_ENV !== "production" ? code : undefined;
  return { sent, error, devOtp };
}

/** Verifies a code and marks it used. Codes are single-use and capped at a handful of
 * guesses so a leaked/expired OTP document can't be brute-forced. */
export async function verifyOtp(mobile: string, code: string, purpose: OtpPurpose): Promise<boolean> {
  await connectDB();

  const otp = await OtpVerification.findOne({ mobile, purpose, used: false }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt.getTime() < Date.now() || otp.attempts >= MAX_VERIFY_ATTEMPTS) {
    return false;
  }

  const isValid = await bcrypt.compare(code, otp.codeHash);
  otp.attempts += 1;

  if (!isValid) {
    await otp.save();
    return false;
  }

  otp.used = true;
  await otp.save();
  return true;
}
