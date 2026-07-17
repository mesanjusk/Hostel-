import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Events the public /api/analytics/collect endpoint accepts from the browser. Anything
 * security- or trust-sensitive (login, registration, OTP outcomes) is logged server-side
 * instead, directly from the auth flow, and is never accepted from an unauthenticated client. */
export const CLIENT_EVENT_NAMES = [
  "page_view",
  "click",
  "button_click",
  "form_interaction",
  "scroll_checkpoint",
  "session_start",
  "registration_page_opened",
] as const;

/** Events only ever written by backend services (auth/otp flows), never by the collect
 * endpoint. Logout isn't included — the app has no server round trip on logout (the
 * frontend just clears its local token), so it's captured like any other button click via
 * the generic click-tracking instead of a dedicated event. */
export const SERVER_EVENT_NAMES = [
  "registration_success",
  "login_success",
  "login_failed",
  "otp_requested",
  "otp_verified",
  "otp_failed",
] as const;

export type ClientEventName = (typeof CLIENT_EVENT_NAMES)[number];
export type ServerEventName = (typeof SERVER_EVENT_NAMES)[number];
export type AnalyticsEventName = ClientEventName | ServerEventName;

/** Single event-sourced collection for the entire analytics system — sessions, funnels,
 * retention, and behavior are all derived from this via aggregation rather than living in
 * their own collections, since the Atlas cluster this app runs on is already at its
 * collection cap (see the note on User.loginAttempts). */
const AnalyticsEventSchema = new Schema(
  {
    eventName: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true, sparse: true },
    visitorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    page: { type: String, default: null },
    referrer: { type: String, default: null },
    referralSource: {
      type: String,
      enum: ["direct", "google", "facebook", "instagram", "whatsapp", "linkedin", "other"],
      default: "direct",
    },
    utm: {
      source: { type: String, default: null },
      medium: { type: String, default: null },
      campaign: { type: String, default: null },
      term: { type: String, default: null },
      content: { type: String, default: null },
    },
    device: {
      type: { type: String, enum: ["mobile", "desktop", "tablet"], default: "desktop" },
      screenWidth: { type: Number, default: null },
      screenHeight: { type: Number, default: null },
    },
    browser: { type: String, default: null },
    os: { type: String, default: null },
    language: { type: String, default: null },
    timezone: { type: String, default: null },
    geo: {
      country: { type: String, default: null },
      state: { type: String, default: null },
      city: { type: String, default: null },
    },
    ipHash: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    // No inline `index: true` here — the TTL index below already covers {timestamp: 1}.
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false },
);

AnalyticsEventSchema.index({ eventName: 1, timestamp: -1 });
AnalyticsEventSchema.index({ sessionId: 1, timestamp: 1 });
AnalyticsEventSchema.index({ visitorId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ page: 1, timestamp: -1 });
AnalyticsEventSchema.index({ "utm.campaign": 1 });
// TTL: bounds raw-event storage growth on a free-tier cluster. Long-term trends should be
// read from rollups computed on top of this data before it expires, not from raw events.
const TTL_SECONDS = Number(process.env.ANALYTICS_TTL_DAYS ?? 180) * 24 * 60 * 60;
AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: TTL_SECONDS });

// This collection is write-heavy (one insert per tracked page action) and only ever read by
// admin analytics dashboards, never on a user-facing request path — so every read against it
// defaults to preferring a secondary (falls back to primary automatically on a single-node
// deployment, and keeps analytics queries from competing with the operational write path once
// this runs as a proper multi-node replica set). Reads on a hot, correctness-sensitive
// operational collection like UserChecklist deliberately do NOT get this treatment.
AnalyticsEventSchema.set("read", "secondaryPreferred");

export type AnalyticsEventDocument = InferSchemaType<typeof AnalyticsEventSchema>;

export const AnalyticsEvent: Model<AnalyticsEventDocument> =
  models.AnalyticsEvent || model<AnalyticsEventDocument>("AnalyticsEvent", AnalyticsEventSchema);
