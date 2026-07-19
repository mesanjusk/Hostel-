import { connectDB } from "@/db";
import { User } from "@/models/User";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { isAdminWindowOpen } from "@/lib/waAdminWindow";

/** How often to check + broadcast, and how long the whole campaign runs before stopping
 * itself — both overridable via env without a code change, since this is a time-bounded
 * go-live monitoring campaign, not a permanent fixture. */
const INTERVAL_MINUTES = Number(process.env.WHATSAPP_ADMIN_CAMPAIGN_INTERVAL_MINUTES) || 30;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;
const CAMPAIGN_DURATION_MS = (Number(process.env.WHATSAPP_ADMIN_CAMPAIGN_HOURS) || 24) * 60 * 60 * 1000;

async function broadcastRegistrationCount(since: Date): Promise<void> {
  await connectDB();

  const admins = await User.find({ role: "admin", waWindowOpenedAt: { $ne: null } })
    .select("mobile waWindowOpenedAt")
    .lean();
  const openAdmins = admins.filter((admin) => isAdminWindowOpen(admin.waWindowOpenedAt));
  // No point counting registrations if there's nobody to tell — skips a DB read on every tick
  // once every admin's window has lapsed.
  if (openAdmins.length === 0) return;

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
 * registered since the last check — one count, not a message per user. Admins whose window
 * has lapsed are silently skipped (see isAdminWindowOpen) — they need to message the business
 * number again to start receiving these. Stops itself after WHATSAPP_ADMIN_CAMPAIGN_HOURS
 * (default 24) rather than running forever; restart the server to run it again. */
export function startRegistrationCountBroadcastJob(): void {
  let lastCheckedAt = new Date();
  const startedAt = Date.now();

  const timer = setInterval(() => {
    if (Date.now() - startedAt >= CAMPAIGN_DURATION_MS) {
      clearInterval(timer);
      return;
    }
    const since = lastCheckedAt;
    lastCheckedAt = new Date();
    void broadcastRegistrationCount(since);
  }, INTERVAL_MS);
  timer.unref();
}
