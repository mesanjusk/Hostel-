import { connectDB } from "@/db";
import { User } from "@/models/User";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { isAdminWindowOpen } from "@/lib/waAdminWindow";
import { getCampaignSettings, markCampaignBroadcastSent } from "@/services/whatsappCampaignService";

/** Fixed 1-minute poll rather than a per-mode dynamic interval — cheap (one settings read, and
 * only a User count when actually due), and short enough that this restart-prone process (the
 * shared EC2 box redeploys on every push to main, sometimes minutes apart) only needs about a
 * minute of uptime to make progress, instead of needing to survive a full campaign interval
 * uninterrupted the way the old in-memory setInterval design did. */
const POLL_MS = 60 * 1000;

async function sendToOptedInAdmins(text: string): Promise<void> {
  const admins = await User.find({
    role: "admin",
    waWindowOpenedAt: { $ne: null },
    waBroadcastEnabled: { $ne: false },
  })
    .select("mobile waWindowOpenedAt")
    .lean();
  const openAdmins = admins.filter((admin) => isAdminWindowOpen(admin.waWindowOpenedAt));
  if (openAdmins.length === 0) return;

  await Promise.all(
    // Every admin account is created with a mobile number (admin provisioning always requires
    // one — see createUserByAdmin) — only anonymous student accounts can lack it.
    openAdmins.map((admin) =>
      sendWhatsAppText(admin.mobile!, text).catch((error) => {
        console.error(`Failed to send WhatsApp campaign message to admin ${admin.mobile}:`, error);
      }),
    ),
  );
}

async function tick(): Promise<void> {
  await connectDB();
  const settings = await getCampaignSettings();
  if (!settings.enabled) return;
  if (settings.endAt && Date.now() >= new Date(settings.endAt).getTime()) return;

  // No prior send recorded (shouldn't normally happen — updateCampaignSettings seeds this the
  // moment the campaign is turned on — but guards a directly-upserted/cold doc all the same):
  // treat "now" as the baseline rather than the start of the collection, so this tick can't
  // report every registration ever as "new".
  const since = settings.lastBroadcastAt ? new Date(settings.lastBroadcastAt) : new Date();

  if (settings.mode === "time") {
    const dueAt = since.getTime() + settings.intervalMinutes * 60 * 1000;
    if (Date.now() < dueAt) return;

    const count = await User.countDocuments({ role: "student", createdAt: { $gte: since } });
    if (settings.skipIfZero && count === 0) {
      // Still advance the cursor — otherwise a quiet interval just gets folded into the next
      // one instead of being reported (or correctly skipped) on its own.
      await markCampaignBroadcastSent();
      return;
    }
    await sendToOptedInAdmins(`New registrations in the last ${settings.intervalMinutes} minutes: ${count}`);
    await markCampaignBroadcastSent();
    return;
  }

  // Quantity mode: keep accumulating (cursor untouched) until the threshold is actually met.
  const count = await User.countDocuments({ role: "student", createdAt: { $gte: since } });
  if (count < settings.quantityThreshold) return;
  await sendToOptedInAdmins(`${count} new registrations since the last update`);
  await markCampaignBroadcastSent();
}

/** Admin-panel-controlled WhatsApp registration campaign: polls every minute, and — only while
 * enabled from the admin panel — texts every admin whose WhatsApp window is open and who hasn't
 * personally opted out, either every intervalMinutes (time mode) or once quantityThreshold new
 * registrations have accumulated (quantity mode). All config is read live from
 * WhatsAppCampaignSettings on each tick, so admin-panel changes take effect within a minute,
 * no restart required. */
export function startWhatsAppCampaignJob(): void {
  const timer = setInterval(() => {
    void tick();
  }, POLL_MS);
  timer.unref();
}
