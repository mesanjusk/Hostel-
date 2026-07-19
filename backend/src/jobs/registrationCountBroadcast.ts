import { connectDB } from "@/db";
import { User } from "@/models/User";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { isAdminWindowOpen } from "@/lib/waAdminWindow";

/** How often to check + broadcast — overridable via env without a code change. */
const INTERVAL_MINUTES = Number(process.env.WHATSAPP_ADMIN_CAMPAIGN_INTERVAL_MINUTES) || 30;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

/** Optional absolute cutoff (e.g. "2026-07-20T10:00:00Z") — an ISO timestamp rather than
 * "N hours after this process started", because this box restarts far more often than the
 * campaign's intended lifetime (see the SIGINT-triggered restarts investigated alongside this
 * change): an hours-since-boot counter would silently extend itself indefinitely every time
 * the process bounces. Unset = no auto-stop; runs every tick until the process itself stops. */
const CAMPAIGN_END_AT = process.env.WHATSAPP_ADMIN_CAMPAIGN_END_AT
  ? new Date(process.env.WHATSAPP_ADMIN_CAMPAIGN_END_AT).getTime()
  : null;

async function broadcastRegistrationCount(): Promise<void> {
  await connectDB();

  const admins = await User.find({ role: "admin", waWindowOpenedAt: { $ne: null } })
    .select("mobile waWindowOpenedAt")
    .lean();
  const openAdmins = admins.filter((admin) => isAdminWindowOpen(admin.waWindowOpenedAt));
  // No point counting registrations if there's nobody to tell — skips a DB read on every tick
  // once every admin's window has lapsed.
  if (openAdmins.length === 0) return;

  // Always "the last INTERVAL_MINUTES minutes from right now" rather than tracking a
  // "since last tick" cursor in memory — a cursor would be lost (and the window silently
  // widen or gap) every time this restart-prone process bounces between ticks.
  const since = new Date(Date.now() - INTERVAL_MS);
  const count = await User.countDocuments({ role: "student", createdAt: { $gte: since } });
  const text = `New registrations in the last ${INTERVAL_MINUTES} minutes: ${count}`;

  await Promise.all(
    openAdmins.map((admin) =>
      sendWhatsAppText(admin.mobile, text).catch((error) => {
        console.error(`Failed to send registration count to admin ${admin.mobile}:`, error);
      }),
    ),
  );
}

/** Go-live monitoring campaign: every WHATSAPP_ADMIN_CAMPAIGN_INTERVAL_MINUTES (default 30),
 * texts every admin whose WhatsApp window is currently open the number of students who
 * registered in that lookback window — one count, not a message per user. Admins whose window
 * has lapsed are silently skipped (see isAdminWindowOpen) — they need to message the business
 * number again to resume receiving these. Optionally stops once WHATSAPP_ADMIN_CAMPAIGN_END_AT
 * passes; unset means it keeps ticking indefinitely. */
export function startRegistrationCountBroadcastJob(): void {
  const timer = setInterval(() => {
    if (CAMPAIGN_END_AT !== null && Date.now() >= CAMPAIGN_END_AT) {
      clearInterval(timer);
      return;
    }
    void broadcastRegistrationCount();
  }, INTERVAL_MS);
  timer.unref();
}
