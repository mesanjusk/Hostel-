import { Router, type Request } from "express";

import {
  checkMobileSchema,
  loginSchema,
  onboardingSchema,
  otpRequestSchema,
  registerVerifySchema,
  resetPasswordSchema,
} from "@/validations/auth";
import { authenticateWithPin, RateLimitedError } from "@/services/authService";
import { completeOnboarding, getUserByMobile, registerUserWithOtp, resetPinWithOtp } from "@/services/userService";
import { seedDefaultChecklistIfEmpty } from "@/services/checklistService";
import { requestOtp, verifyOtp, OtpCooldownError } from "@/services/otpService";
import { signAuthToken } from "@/lib/jwt";
import { serializeUser } from "@/lib/serialize";
import { requireAuth } from "@/middleware/auth";
import { logEventAsync } from "@/services/eventService";
import { listEducationOptions } from "@/services/checklistMasterService";

export const authRouter = Router();

/** Pulls the visitor/session ids the frontend's analytics client attaches to every request
 * (see frontend lib/analytics/client.ts) so server-emitted auth events land in the same
 * timeline as the client-tracked page views for that visitor. Falls back to an ip-derived
 * id for old/no-JS clients so the event is still recorded, just not funnel-attributable. */
function eventContext(req: Request) {
  const fallback = `server-${req.analytics?.ip ?? "unknown"}`;
  return {
    visitorId: req.analytics?.visitorId ?? fallback,
    sessionId: req.analytics?.sessionId ?? fallback,
    ip: req.analytics?.ip ?? null,
    userAgent: req.analytics?.userAgent ?? null,
  };
}

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const ctx = eventContext(req);

  try {
    const user = await authenticateWithPin(parsed.data.mobile, parsed.data.pin);
    if (!user) {
      logEventAsync({ eventName: "login_failed", ...ctx });
      res.status(401).json({ error: "Invalid mobile number or login code" });
      return;
    }

    logEventAsync({ eventName: "login_success", userId: user._id.toString(), ...ctx });
    const token = signAuthToken(user._id.toString());
    res.json({ token, user: serializeUser(user) });
  } catch (error) {
    if (error instanceof RateLimitedError) {
      logEventAsync({ eventName: "login_failed", ...ctx, metadata: { reason: "rate_limited" } });
      res.status(429).json({ error: error.message });
      return;
    }
    throw error;
  }
});

// Lets the unified mobile-number entry screen route to the right next step (enter your
// login code vs. verify a WhatsApp OTP) without the visitor having to pick "log in" or
// "register" themselves. Only reveals existence, which the register/reset flows already
// leak via their own error messages.
authRouter.post("/check-mobile", async (req, res) => {
  const parsed = checkMobileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const existing = await getUserByMobile(parsed.data.mobile);
  res.json({ exists: Boolean(existing) });
});

authRouter.post("/register/request-otp", async (req, res) => {
  const parsed = otpRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const existing = await getUserByMobile(parsed.data.mobile);
  if (existing) {
    res.status(400).json({ error: "An account with this mobile number already exists. Try logging in instead." });
    return;
  }

  try {
    const result = await requestOtp(parsed.data.mobile, "register");
    logEventAsync({ eventName: "otp_requested", ...eventContext(req), metadata: { purpose: "register" } });
    res.json(result);
  } catch (error) {
    if (error instanceof OtpCooldownError) {
      res.status(429).json({ error: error.message });
      return;
    }
    throw error;
  }
});

authRouter.post("/register/verify", async (req, res) => {
  const parsed = registerVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const ctx = eventContext(req);

  const isValid = await verifyOtp(parsed.data.mobile, parsed.data.code, "register");
  if (!isValid) {
    logEventAsync({ eventName: "otp_failed", ...ctx, metadata: { purpose: "register" } });
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }
  logEventAsync({ eventName: "otp_verified", ...ctx, metadata: { purpose: "register" } });

  const result = await registerUserWithOtp(parsed.data.mobile, parsed.data.code, parsed.data.pin);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  logEventAsync({ eventName: "registration_success", userId: result.user._id.toString(), ...ctx });

  // Seeding waits until /onboarding, where collegeCategory is known — the starter
  // checklist depends on it (e.g. Fashion Design Tools items are Designing-only), and
  // ProtectedRoute blocks the checklist page until onboarding is complete anyway.

  const token = signAuthToken(result.user._id.toString());
  res.json({ token, user: serializeUser(result.user) });
});

authRouter.post("/forgot-password/request-otp", async (req, res) => {
  const parsed = otpRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const existing = await getUserByMobile(parsed.data.mobile);
  if (!existing) {
    res.status(400).json({ error: "No account found with this mobile number. Try registering instead." });
    return;
  }

  try {
    const result = await requestOtp(parsed.data.mobile, "reset");
    logEventAsync({ eventName: "otp_requested", ...eventContext(req), metadata: { purpose: "reset" } });
    res.json(result);
  } catch (error) {
    if (error instanceof OtpCooldownError) {
      res.status(429).json({ error: error.message });
      return;
    }
    throw error;
  }
});

authRouter.post("/forgot-password/reset", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const ctx = eventContext(req);

  const isValid = await verifyOtp(parsed.data.mobile, parsed.data.code, "reset");
  if (!isValid) {
    logEventAsync({ eventName: "otp_failed", ...ctx, metadata: { purpose: "reset" } });
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }
  logEventAsync({ eventName: "otp_verified", ...ctx, metadata: { purpose: "reset" } });

  const result = await resetPinWithOtp(parsed.data.mobile, parsed.data.code, parsed.data.pin);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  logEventAsync({ eventName: "login_success", userId: result.user._id.toString(), ...ctx, metadata: { via: "reset" } });
  const token = signAuthToken(result.user._id.toString());
  res.json({ token, user: serializeUser(result.user) });
});

authRouter.get("/education-options", async (_req, res) => {
  res.json(await listEducationOptions());
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user!) });
});

authRouter.post("/onboarding", requireAuth, async (req, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const updated = await completeOnboarding(req.user!._id.toString(), parsed.data);
  await seedDefaultChecklistIfEmpty(req.user!._id.toString());

  const token = signAuthToken(req.user!._id.toString());
  res.json({ token, user: { ...serializeUser(req.user!), ...updated, needsOnboarding: false } });
});
