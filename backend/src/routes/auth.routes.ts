import { Router } from "express";

import { loginSchema, onboardingSchema } from "@/validations/auth";
import { authenticateWithPin, RateLimitedError } from "@/services/authService";
import { completeOnboarding } from "@/services/userService";
import { seedDefaultChecklistIfEmpty } from "@/services/checklistService";
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
