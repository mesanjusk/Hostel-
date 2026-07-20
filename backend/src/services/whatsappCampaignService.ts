import { connectDB } from "@/db";
import { User } from "@/models/User";
import { WhatsAppCampaignSettings, WHATSAPP_CAMPAIGN_SETTINGS_KEY } from "@/models/WhatsAppCampaignSettings";
import { isAdminWindowOpen } from "@/lib/waAdminWindow";

export type WhatsAppCampaignMode = "time" | "quantity";

export interface WhatsAppCampaignSettingsDTO {
  enabled: boolean;
  mode: WhatsAppCampaignMode;
  intervalMinutes: number;
  quantityThreshold: number;
  skipIfZero: boolean;
  endAt: string | null;
  lastBroadcastAt: string | null;
}

interface SettingsDocLike {
  enabled?: boolean;
  mode?: WhatsAppCampaignMode;
  intervalMinutes?: number;
  quantityThreshold?: number;
  skipIfZero?: boolean;
  endAt?: Date | null;
  lastBroadcastAt?: Date | null;
}

function toDTO(doc: SettingsDocLike | null): WhatsAppCampaignSettingsDTO {
  return {
    enabled: doc?.enabled ?? false,
    mode: doc?.mode ?? "time",
    intervalMinutes: doc?.intervalMinutes ?? 30,
    quantityThreshold: doc?.quantityThreshold ?? 10,
    skipIfZero: doc?.skipIfZero ?? false,
    endAt: doc?.endAt ? doc.endAt.toISOString() : null,
    lastBroadcastAt: doc?.lastBroadcastAt ? doc.lastBroadcastAt.toISOString() : null,
  };
}

/** Reads (upserting the singleton on a cold collection, so a fresh deploy never 500s) the
 * campaign config. Used both by the admin panel and by the job itself — the job re-parses
 * endAt/lastBroadcastAt back into Dates, since this DTO is JSON/API-shaped (ISO strings). */
export async function getCampaignSettings(): Promise<WhatsAppCampaignSettingsDTO> {
  await connectDB();
  const doc = await WhatsAppCampaignSettings.findOneAndUpdate(
    { key: WHATSAPP_CAMPAIGN_SETTINGS_KEY },
    { $setOnInsert: { key: WHATSAPP_CAMPAIGN_SETTINGS_KEY } },
    { upsert: true, new: true },
  ).lean();
  return toDTO(doc);
}

export async function updateCampaignSettings(updates: {
  enabled: boolean;
  mode: WhatsAppCampaignMode;
  intervalMinutes: number;
  quantityThreshold: number;
  skipIfZero: boolean;
  endAt: Date | null;
}): Promise<WhatsAppCampaignSettingsDTO> {
  await connectDB();
  const current = await WhatsAppCampaignSettings.findOne({ key: WHATSAPP_CAMPAIGN_SETTINGS_KEY }).lean();

  // Starting the campaign (off -> on, including the very first time it's ever turned on) resets
  // the counting baseline to right now — otherwise the first tick after enabling would report
  // every registration since the collection's creation as "new".
  const resetBaseline = updates.enabled && !current?.enabled;

  const doc = await WhatsAppCampaignSettings.findOneAndUpdate(
    { key: WHATSAPP_CAMPAIGN_SETTINGS_KEY },
    {
      $set: {
        key: WHATSAPP_CAMPAIGN_SETTINGS_KEY,
        ...updates,
        ...(resetBaseline ? { lastBroadcastAt: new Date() } : {}),
      },
    },
    { upsert: true, new: true },
  ).lean();
  return toDTO(doc);
}

/** Advances the cursor after a tick sends (or, in time mode, deliberately skips a zero-count
 * interval) — the job's only write back to settings. */
export async function markCampaignBroadcastSent(): Promise<void> {
  await connectDB();
  await WhatsAppCampaignSettings.updateOne({ key: WHATSAPP_CAMPAIGN_SETTINGS_KEY }, { lastBroadcastAt: new Date() });
}

export interface AdminWaStatusDTO {
  id: string;
  name: string | null;
  mobile: string;
  waWindowOpenedAt: string | null;
  isWindowOpen: boolean;
  waBroadcastEnabled: boolean;
}

/** All admin accounts with their current WhatsApp opt-in window + per-admin broadcast toggle —
 * feeds the admin panel's roster table. */
export async function listAdminsWithWaStatus(): Promise<AdminWaStatusDTO[]> {
  await connectDB();
  const admins = await User.find({ role: "admin" })
    .select("name mobile waWindowOpenedAt waBroadcastEnabled")
    .sort({ createdAt: 1 })
    .lean();
  return admins.map((admin) => ({
    id: admin._id.toString(),
    name: admin.name ?? null,
    mobile: admin.mobile,
    waWindowOpenedAt: admin.waWindowOpenedAt ? admin.waWindowOpenedAt.toISOString() : null,
    isWindowOpen: isAdminWindowOpen(admin.waWindowOpenedAt),
    waBroadcastEnabled: admin.waBroadcastEnabled ?? true,
  }));
}

/** Shared by both write paths to the same field: the master admin panel toggling any admin's
 * row, and an admin toggling their own setting from their profile page. */
export async function setAdminBroadcastEnabled(userId: string, enabled: boolean) {
  await connectDB();
  return User.findByIdAndUpdate(userId, { waBroadcastEnabled: enabled }, { returnDocument: "after" }).lean();
}
