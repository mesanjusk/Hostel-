import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, default: null, trim: true, maxlength: 80 },
    mobile: { type: String, required: true, unique: true, index: true },
    avatar: { type: String, default: null },
    college: { type: String, default: null, trim: true, maxlength: 120 },
    hostel: { type: String, default: null, trim: true, maxlength: 120 },
    roomNumber: { type: String, default: null, trim: true, maxlength: 20 },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    notificationsEnabled: { type: Boolean, default: true },
    optedOutOfBroadcast: { type: Boolean, default: false },
    /** bcrypt hash of an admin-issued 7-digit login code. Never store or return the plain code. */
    loginPinHash: { type: String, default: null },
    /** Timestamps of recent mobile+PIN login attempts, for rate-limiting. Trimmed to the
     * current window on each check — kept on User instead of a separate collection since the
     * Atlas cluster is at its collection cap. */
    loginAttempts: { type: [{ type: Date }], default: [] },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDocument> =
  models.User || model<UserDocument>("User", UserSchema);
