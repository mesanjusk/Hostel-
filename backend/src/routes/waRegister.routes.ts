import { Router } from "express";

import { waRegisterStartSchema, waRegisterStatusSchema } from "@/validations/waRegister";
import { getRegistrationStatus, startPendingRegistration, WaRegisterCooldownError } from "@/services/waRegisterService";

/** Standalone router for the experimental /wa-login self-registration page — kept separate
 * from authRouter so this in-progress flow can't affect the production login/register
 * endpoints. See waRegisterService for the actual handshake logic. */
export const waRegisterRouter = Router();

waRegisterRouter.post("/start", async (req, res) => {
  const parsed = waRegisterStartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const result = await startPendingRegistration(parsed.data.mobile, parsed.data.pin);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ pendingId: result.pendingId });
  } catch (error) {
    if (error instanceof WaRegisterCooldownError) {
      res.status(429).json({ error: error.message });
      return;
    }
    throw error;
  }
});

waRegisterRouter.get("/status", async (req, res) => {
  const parsed = waRegisterStatusSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await getRegistrationStatus(parsed.data.pendingId);
  res.json(result);
});
