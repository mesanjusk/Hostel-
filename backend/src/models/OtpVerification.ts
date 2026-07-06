import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const OtpVerificationSchema = new Schema(
  {
    mobile: { type: String, required: true, index: true },
    purpose: { type: String, enum: ["register", "reset"], required: true },
    /** bcrypt hash of the 6-digit code. Never store or return the plain code. */
    codeHash: { type: String, required: true },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL index: MongoDB deletes the doc once its own expiresAt value is in the past.
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpVerificationDocument = InferSchemaType<typeof OtpVerificationSchema>;

export const OtpVerification: Model<OtpVerificationDocument> =
  models.OtpVerification || model<OtpVerificationDocument>("OtpVerification", OtpVerificationSchema);
