import { Router } from "express";

import { profileUpdateSchema, notificationSettingsSchema } from "@/validations/profile";
import { setNotificationPreference, updateProfile } from "@/services/userService";
import { requireAuth } from "@/middleware/auth";
import { toPlain } from "@/lib/serialize";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.patch("/", async (req, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const user = await updateProfile(req.user!._id.toString(), parsed.data);
  res.json({ user: toPlain(user) });
});

profileRouter.patch("/notifications", async (req, res) => {
  const parsed = notificationSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const user = await setNotificationPreference(req.user!._id.toString(), parsed.data.notificationsEnabled);
  res.json({ user: toPlain(user) });
});
