import type { Request } from "express";
import { createAsyncRouter } from "@/lib/asyncRouter";

import {
  checkMobileSchema,
  genderUpdateSchema,
  loginSchema,
  onboardingSchema,
  otpRequestSchema,
  registerVerifySchema,
  resetPasswordSchema,
  widgetVerifySchema,
} from "@/validations/auth";
import { authenticateWithPin, RateLimitedError } from "@/services/authService";
import {
  completeOnboarding,
  getOrCreateAnonymousUserByDeviceId,
  getOrCreateUserByMobile,
  getUserByMobile,
  linkMobileToUser,
  registerUserWithOtp,
  resetPinWithOtp,
  setUserGender,
} from "@/services/userService";
import { requestOtp, verifyOtp, OtpCooldownError, OtpDailyLimitError } from "@/services/otpService";
import { verifyWidgetToken, Msg91Error } from "@/services/msg91Service";
import { signAuthToken } from "@/lib/jwt";
import { serializeUser } from "@/lib/serialize";
import { requireAuth, optionalAuth } from "@/middleware/auth";
import { logEventAsync } from "@/services/eventService";

export const authRouter = createAsyncRouter();

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

// Called the moment the app boots with no session token at all (see frontend
// auth-context.tsx) — not only a brand-new browser's very first visit, but also every time the
// frontend needs to re-establish a session it's lost track of (expired/rotated token, a
// request dropped mid-bootstrap, two tabs racing on first load). Get-or-create BY DEVICE ID
// (getOrCreateAnonymousUserByDeviceId) rather than always inserting is what keeps those
// re-establishments from spawning a second, empty account for the same browser — see that
// function's own comment for why a blind create() here used to orphan a visitor's
// already-set gender/college/checklist behind a duplicate row every time their token died.
authRouter.post("/anonymous", async (req, res) => {
  const ctx = eventContext(req);
  // Deliberately NOT ctx.visitorId — that falls back to an IP-derived id for old/no-JS clients,
  // which would incorrectly dedupe unrelated visitors behind the same NAT. The lookup only ever
  // trusts a real X-Visitor-Id header.
  const { user, isNew } = await getOrCreateAnonymousUserByDeviceId(req.analytics?.visitorId ?? null);
  if (isNew) {
    logEventAsync({ eventName: "registration_success", userId: user._id.toString(), ...ctx, metadata: { via: "anonymous" } });
  }
  const token = signAuthToken(user._id.toString(), user.tokenVersion ?? 0);
  res.json({ token, user: serializeUser(user) });
});

// Sets/changes gender for whoever is currently signed in — anonymous or fully identified. Its
// own narrow endpoint (rather than folded into /onboarding or profile update) because the
// Home-page gender popup needs to write exactly this one field the moment an anonymous visitor
// picks it, without also requiring the rest of a profile edit.
authRouter.patch("/gender", requireAuth, async (req, res) => {
  const parsed = genderUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const updated = await setUserGender(req.user!._id.toString(), parsed.data.gender);
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: serializeUser(updated) });
});

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
    const token = signAuthToken(user._id.toString(), user.tokenVersion ?? 0);
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

// Passwordless sign-in via the MSG91 "Login with OTP" widget (same widget/account as the
// WhatsLocal project). The browser verifies the OTP against the widget and posts the signed
// access-token here; we confirm it with MSG91, read the VERIFIED mobile out of it (never
// trusting the number from the client), then get-or-create the account and issue our session
// JWT. First sign-in for a number creates the account (→ needsOnboarding); returning numbers
// just log in. This replaces the WhatsApp-OTP register/reset + mobile-PIN login as the primary
// auth path.
authRouter.post("/otp/widget-verify", optionalAuth, async (req, res) => {
  const parsed = widgetVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const ctx = eventContext(req);

  let mobile: string;
  try {
    mobile = await verifyWidgetToken(parsed.data.accessToken);
  } catch (error) {
    if (error instanceof Msg91Error) {
      logEventAsync({ eventName: "otp_failed", ...ctx, metadata: { via: "msg91_widget" } });
      res.status(401).json({ error: error.message });
      return;
    }
    throw error;
  }

  const existingByMobile = await getUserByMobile(mobile);
  const isNew = !existingByMobile;

  // The session making this request is already an anonymous account (created transparently on
  // first visit — see POST /anonymous) and this mobile isn't claimed by anyone else: attach it
  // to that SAME document in place, rather than creating a second account, so every bit of
  // checklist/budget/notes/etc. this visitor already saved anonymously stays theirs. Any other
  // case (no session yet, or the number already belongs to a different, already-identified
  // account) falls back to the normal get-or-create/log-into-that-account behavior.
  const user =
    req.user && !req.user.mobile && !existingByMobile
      ? await linkMobileToUser(req.user._id.toString(), mobile)
      : await getOrCreateUserByMobile(mobile, ctx.visitorId);

  if (!user) {
    // linkMobileToUser's target vanished mid-request (extremely unlikely) — fall back rather
    // than 500.
    res.status(409).json({ error: "Something went wrong linking your account. Please try again." });
    return;
  }

  logEventAsync({ eventName: "otp_verified", ...ctx, metadata: { via: "msg91_widget" } });
  logEventAsync({
    eventName: isNew ? "registration_success" : "login_success",
    userId: user._id.toString(),
    ...ctx,
    metadata: { via: "msg91_widget" },
  });

  const token = signAuthToken(user._id.toString(), user.tokenVersion ?? 0);
  res.json({ token, user: serializeUser(user) });
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
    if (error instanceof OtpCooldownError || error instanceof OtpDailyLimitError) {
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

  const token = signAuthToken(result.user._id.toString(), result.user.tokenVersion ?? 0);
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
    if (error instanceof OtpCooldownError || error instanceof OtpDailyLimitError) {
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
  const token = signAuthToken(result.user._id.toString(), result.user.tokenVersion ?? 0);
  res.json({ token, user: serializeUser(result.user) });
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
  // No eager checklist generation needed: the checklist page always computes a live view from
  // the catalog filtered by the student's college category/course/gender, and a real row only
  // gets written the moment they actually touch an item. See userChecklistService.ts.

  const token = signAuthToken(req.user!._id.toString(), req.user!.tokenVersion ?? 0);
  res.json({ token, user: { ...serializeUser(req.user!), ...updated, needsOnboarding: false } });
});
