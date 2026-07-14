import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Tracks a self-registration attempt started on the /wa-login page, waiting for the
 * matching "Register me as ..." WhatsApp message to arrive at the webhook. Short-lived by
 * design (TTL below) — this is not the account itself, just the handshake between the web
 * form and the WhatsApp message that proves ownership of the number. */
const WaPendingRegistrationSchema = new Schema(
  {
    mobile: { type: String, required: true, index: true },
    /** bcrypt hash of the 4-digit PIN the visitor chose on the web form. */
    pinHash: { type: String, required: true },
    status: { type: String, enum: ["pending", "registered"], default: "pending", index: true },
    resultUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    /** WhatsApp profile display name, captured when the registration message arrives —
     * used only to prefill the onboarding form's name field, never written to User.name
     * directly (keeps the same needsOnboarding flow every other signup goes through). */
    suggestedName: { type: String, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL index: MongoDB deletes the doc once its own expiresAt value is in the past.
WaPendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type WaPendingRegistrationDocument = InferSchemaType<typeof WaPendingRegistrationSchema>;

export const WaPendingRegistration: Model<WaPendingRegistrationDocument> =
  models.WaPendingRegistration ||
  model<WaPendingRegistrationDocument>("WaPendingRegistration", WaPendingRegistrationSchema);
