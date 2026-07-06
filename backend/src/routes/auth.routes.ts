import { Router } from "express";

import {
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

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const user = await authenticateWithPin(parsed.data.mobile, parsed.data.pin);
    if (!user) {
      res.status(401).json({ error: "Invalid mobile number or login code" });
      return;
    }

    const token = signAuthToken(user._id.toString());
    res.json({ token, user: serializeUser(user) });
  } catch (error) {
    if (error instanceof RateLimitedError) {
      res.status(429).json({ error: error.message });
      return;
    }
    throw error;
  }
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

  const isValid = await verifyOtp(parsed.data.mobile, parsed.data.code, "register");
  if (!isValid) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  const result = await registerUserWithOtp(parsed.data.mobile, parsed.data.pin);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  await seedDefaultChecklistIfEmpty(result.user._id.toString());

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

  const isValid = await verifyOtp(parsed.data.mobile, parsed.data.code, "reset");
  if (!isValid) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  const result = await resetPinWithOtp(parsed.data.mobile, parsed.data.pin);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  const token = signAuthToken(result.user._id.toString());
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
  await seedDefaultChecklistIfEmpty(req.user!._id.toString());

  const token = signAuthToken(req.user!._id.toString());
  res.json({ token, user: { ...serializeUser(req.user!), ...updated, needsOnboarding: false } });
});
