import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Fixed discriminator for the one settings document this app ever has — same
 * find-or-upsert-by-key pattern as GenderThemeSettings/LandingPageSettings. */
export const WHATSAPP_CAMPAIGN_SETTINGS_KEY = "whatsapp_campaign";

/** Admin-tunable config for the registration-count WhatsApp campaign (jobs/whatsappCampaignJob.ts)
 * — previously fixed env vars read once at boot, now live-editable from the admin panel without
 * a deploy/restart. Defaults to `enabled: false`: a campaign only runs once an admin explicitly
 * starts it from the panel, mirroring the "start/pause" control they asked for. */
const WhatsAppCampaignSettingsSchema = new Schema(
  {
    key: { type: String, default: WHATSAPP_CAMPAIGN_SETTINGS_KEY, unique: true },
    enabled: { type: Boolean, default: false },
    /** "time" — broadcast every intervalMinutes. "quantity" — broadcast once quantityThreshold
     * new registrations have accumulated since the last send. */
    mode: { type: String, enum: ["time", "quantity"], default: "time" },
    intervalMinutes: { type: Number, default: 30, min: 1 },
    quantityThreshold: { type: Number, default: 10, min: 1 },
    /** Time mode only — skip sending (but still advance the window) when the count for that
     * interval is zero, instead of texting admins "0" every tick. */
    skipIfZero: { type: Boolean, default: false },
    /** Optional absolute cutoff — an admin-set timestamp rather than "N hours after enabling",
     * since this box restarts far more often than most campaign durations (see the SIGINT-
     * restart investigation this replaced env-var config over). Null means no auto-stop. */
    endAt: { type: Date, default: null },
    /** Cursor both modes use to know what "new since last check" means — persisted here (not
     * in-process memory) specifically so a process restart never loses it. */
    lastBroadcastAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type WhatsAppCampaignSettingsDocument = InferSchemaType<typeof WhatsAppCampaignSettingsSchema>;

export const WhatsAppCampaignSettings: Model<WhatsAppCampaignSettingsDocument> =
  models.WhatsAppCampaignSettings ||
  model<WhatsAppCampaignSettingsDocument>("WhatsAppCampaignSettings", WhatsAppCampaignSettingsSchema);
