import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { COLLEGE_CATEGORY_OPTIONS, GENDER_OPTIONS } from "@/types";

const UserSchema = new Schema(
  {
    name: { type: String, default: null, trim: true, maxlength: 80 },
    mobile: { type: String, required: true, unique: true, index: true },
    avatar: { type: String, default: null },
    gender: { type: String, enum: GENDER_OPTIONS, default: null },
    college: { type: String, default: null, trim: true, maxlength: 120 },
    /** City selected at registration, from the admin-managed City catalog (see City model). */
    city: { type: String, default: null, trim: true, maxlength: 80 },
    /** Optional — added later from the profile page, not collected at registration. */
    homeTown: { type: String, default: null, trim: true, maxlength: 80 },
    /** Legacy fixed-enum field — kept for existing users and old code paths (categoryService's
     * Designing-only checklist folder, admin filters). New signups are classified via
     * collegeCategoryId/courseId instead; see userService.LEGACY_COLLEGE_CATEGORY_MAP for the
     * best-effort mapping kept in sync between the two. */
    collegeCategory: { type: String, enum: COLLEGE_CATEGORY_OPTIONS, default: null },
    /** DB-driven taxonomy (see CollegeCategory/Course models) — what the checklist generation
     * algorithm and admin-managed DefaultChecklistItem targeting actually use. */
    collegeCategoryId: { type: Schema.Types.ObjectId, ref: "CollegeCategory", default: null, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    notificationsEnabled: { type: Boolean, default: true },
    optedOutOfBroadcast: { type: Boolean, default: false },
    /** bcrypt hash of an admin-issued 7-digit login code. Never store or return the plain code. */
    loginPinHash: { type: String, default: null },
    /** Plaintext 4-digit PIN chosen via the /wa-login self-registration flow — kept only so a
     * "send my code" WhatsApp request can resend the same code instead of rotating it every
     * time. Null for accounts that never went through that flow (admin-provisioned, OTP
     * self-registration); those get a freshly generated 4-digit code on first request, which
     * is then saved here too. Deliberately plaintext, not hashed — the whole point is reading
     * it back. loginPinHash remains the actual bcrypt-hashed credential used to authenticate. */
    waLoginPin: { type: String, default: null },
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
     * array (same rationale as loginAttempts) rather than a new collection. Indexed (multikey)
     * since discovery looks up "who has blocked me" via `User.find({ blockedUserIds: viewerId })`
     * on every Co-Packer/Roommate request. */
    blockedUserIds: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [], index: true },
    /** Saved Places to Explore, most-recent first. */
    favoritePlaceIds: { type: [{ type: Schema.Types.ObjectId, ref: "Place" }], default: [] },

    /** Community/chat public identity — the ONLY identity other students ever see. `name`,
     * `mobile`, `city`/`college`/room/address stay private and are never selected into a
     * community/chat API response (see lib/serialize.ts's serializePublicUser). Generated
     * automatically at account creation (see lib/username.ts) and editable from Settings. */
    username: { type: String, default: null, trim: true, lowercase: true, maxlength: 32, unique: true, sparse: true, index: true },
    displayName: { type: String, default: null, trim: true, maxlength: 40 },
    bio: { type: String, default: "", trim: true, maxlength: 200 },
    interests: { type: [{ type: String, trim: true, maxlength: 40 }], default: [] },
    /** Free-text campus/branch within a college — not a foreign key, since not every college
     * in India runs multiple campuses through this catalog yet. */
    campus: { type: String, default: null, trim: true, maxlength: 120 },
    year: { type: String, default: null, trim: true, maxlength: 20 },
  },
  { timestamps: true },
);

/** Backs the admin dashboard's "active in last 7/30 days" counts (countActiveUsers), which
 * filter on updatedAt — without this, that query is a full collection scan. */
UserSchema.index({ updatedAt: 1 });

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDocument> = models.User || model<UserDocument>("User", UserSchema);
