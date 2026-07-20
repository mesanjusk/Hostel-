import { createAsyncRouter } from "@/lib/asyncRouter";

import { profileUpdateSchema, notificationSettingsSchema, whatsappBroadcastSettingsSchema } from "@/validations/profile";
import { setNotificationPreference, updateProfile } from "@/services/userService";
import { setAdminBroadcastEnabled } from "@/services/whatsappCampaignService";
import { requireAuth } from "@/middleware/auth";
import { toPlain } from "@/lib/serialize";

export const profileRouter = createAsyncRouter();

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

// Self-service: an admin opts themselves out of (or back into) the WhatsApp registration-count
// campaign without needing another admin to do it from the master panel. Harmless for a
// non-admin caller too — the campaign only ever reads this field for role:"admin" accounts.
profileRouter.patch("/whatsapp-notifications", async (req, res) => {
  const parsed = whatsappBroadcastSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  await setAdminBroadcastEnabled(req.user!._id.toString(), parsed.data.waBroadcastEnabled);
  res.json({ success: true });
});
