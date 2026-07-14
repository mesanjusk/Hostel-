import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { COLLEGE_CATEGORY_OPTIONS, GENDER_OPTIONS } from "@/types";

const UserSchema = new Schema(
  {
    name: { type: String, default: null, trim: true, maxlength: 80 },
    mobile: { type: String, required: true, unique: true, index: true },
    avatar: { type: String, default: null },
    gender: { type: String, enum: GENDER_OPTIONS, default: null },
    college: { type: String, default: null, trim: true, maxlength: 120 },
    collegeCategory: { type: String, enum: COLLEGE_CATEGORY_OPTIONS, default: null },
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

    /** Admin-verified identity — surfaced as a discovery/directory trust signal ("Only show
     * verified users"). Distinct from having a valid login: verification is a manual admin
     * action, not automatic on account creation. */
    verified: { type: Boolean, default: false },
    /** Optional — enables age-range matching in Co-Packer/Roommate discovery. Never required. */
    dateOfBirth: { type: Date, default: null },
    /** Users this account has blocked, for discovery/directory features. Kept as an embedded
     * array (same rationale as loginAttempts) rather than a new collection. */
    blockedUserIds: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    /** Saved Places to Explore, most-recent first. */
    favoritePlaceIds: { type: [{ type: Schema.Types.ObjectId, ref: "Place" }], default: [] },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDocument> = models.User || model<UserDocument>("User", UserSchema);
