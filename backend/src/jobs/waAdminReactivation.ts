import { connectDB } from "@/db";
import { User } from "@/models/User";
import { sendWhatsAppAdminReactivationPrompt } from "@/lib/whatsapp";
import { ADMIN_WINDOW_MS } from "@/lib/waAdminWindow";

/** Hours-since-window-opened offsets at which a reactivation reminder fires — 3 reminders
 * spread across the ~23h window (ADMIN_WINDOW_MS), the last one close enough to expiry to
 * give the admin a real chance to tap through before the window actually closes. */
const REMINDER_OFFSETS_MS = [8, 16, 22].map((hours) => hours * 60 * 60 * 1000);

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

async function runReactivationCheck(): Promise<void> {
  await connectDB();

  const admins = await User.find({ role: "admin", waWindowOpenedAt: { $ne: null } })
    .select("mobile waWindowOpenedAt waReactivationCount")
    .lean();

  const now = Date.now();
  for (const admin of admins) {
    const elapsed = now - admin.waWindowOpenedAt!.getTime();
    const sent = admin.waReactivationCount ?? 0;
    if (elapsed >= ADMIN_WINDOW_MS || sent >= REMINDER_OFFSETS_MS.length) continue;
    if (elapsed < REMINDER_OFFSETS_MS[sent]) continue;

    try {
      await sendWhatsAppAdminReactivationPrompt(admin.mobile);
      await User.updateOne({ _id: admin._id }, { $inc: { waReactivationCount: 1 } });
    } catch (error) {
      console.error(`Failed to send WhatsApp reactivation prompt to admin ${admin.mobile}:`, error);
    }
  }
}

/** Starts the periodic check that nudges admins to reopen their WhatsApp window before it
 * expires. Plain setInterval rather than a cron dependency — matches the existing in-memory
 * timer pattern used elsewhere in this backend (rateLimiter.ts, eventService.ts,
 * whatsapp.routes.ts's pruneExpired). */
export function startWaAdminReactivationJob(): void {
  setInterval(() => {
    void runReactivationCheck();
  }, CHECK_INTERVAL_MS).unref();
}
