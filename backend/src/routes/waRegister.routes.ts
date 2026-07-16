import { createAsyncRouter } from "@/lib/asyncRouter";

import { waRegisterStartSchema, waRegisterStatusSchema } from "@/validations/waRegister";
import { getRegistrationStatus, startPendingRegistration, WaRegisterCooldownError } from "@/services/waRegisterService";
import { checkRateLimit } from "@/lib/rateLimiter";

/** Standalone router for the experimental /wa-login self-registration page — kept separate
 * from authRouter so this in-progress flow can't affect the production login/register
 * endpoints. See waRegisterService for the actual handshake logic. */
export const waRegisterRouter = createAsyncRouter();

waRegisterRouter.post("/start", async (req, res) => {
  // Both routes here are unauthenticated by design (that's the whole point of self-
  // registration) — key the limiter on IP instead of a user id. Deliberately generous: many
  // real students behind the same hostel/campus WiFi NAT share one public IP, and each start
  // is a cheap DB write with no external API call behind it — the per-mobile 15s restart
  // cooldown (see WaRegisterCooldownError) is what actually guards against one number being
  // resubmitted rapidly; this IP layer only needs to catch a genuinely scripted flood.
  if (!checkRateLimit(`wa-start:${req.ip}`, 200, 60 * 60 * 1000)) {
    res.status(429).json({ error: "Too many attempts. Please try again later." });
    return;
  }

  const parsed = waRegisterStartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const result = await startPendingRegistration(parsed.data.mobile, parsed.data.pin);
    res.json({ pendingId: result.pendingId, mode: result.mode });
  } catch (error) {
    if (error instanceof WaRegisterCooldownError) {
      res.status(429).json({ error: error.message });
      return;
    }
    throw error;
  }
});

waRegisterRouter.get("/status", async (req, res) => {
  // The pollToken itself is now the actual authorization (crypto-random, unguessable) — this
  // limiter is defense in depth against brute-forcing it, not the primary control. Sized
  // generously: the frontend polls every 3s per in-progress registration with no attempt cap
  // (see wa-login-form.tsx), so dozens of students on the same shared WiFi mid-registration at
  // once is expected legitimate traffic, not abuse.
  if (!checkRateLimit(`wa-status:${req.ip}`, 1000, 60 * 1000)) {
    res.status(429).json({ error: "Too many attempts. Please try again later." });
    return;
  }

  const parsed = waRegisterStatusSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await getRegistrationStatus(parsed.data.pendingId);
  res.json(result);
});
