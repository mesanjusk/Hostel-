import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { COLLEGE_CATEGORY_OPTIONS, GENDER_OPTIONS } from "@/types";

const UserSchema = new Schema(
  {
    name: { type: String, default: null, trim: true, maxlength: 80 },
    /** Absent (not `null`) for an unidentified visitor — an anonymous session created the
     * moment someone lands on the site (see userService.createAnonymousUser), before they've
     * ever provided a mobile number. Left genuinely unset rather than defaulted to `null` so
     * the sparse unique index below only enforces uniqueness once a mobile actually exists;
     * many anonymous documents with the field literally set to `null` would collide on that
     * index. Set exactly once, in place on the same document, the moment that visitor either
     * links a number via OTP (userService merges it into their existing anonymous account) or
     * an admin provisions a fully-identified account directly. */
    mobile: { type: String, unique: true, sparse: true, index: true },
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
    /** WhatsApp customer-service-window bookkeeping — only meaningful for role:"admin"
     * accounts. Set the moment an inbound WhatsApp message from this admin's mobile is seen at
     * the webhook (routes/whatsapp.routes.ts), mirroring Meta's real 24h window semantics
     * rather than a flag we control ourselves. The registration-count campaign
     * (jobs/whatsappCampaignJob.ts) only texts admins whose window is still open — an admin
     * whose window has lapsed needs to message the business number again. */
    waWindowOpenedAt: { type: Date, default: null },
    /** Per-admin override, independent of the window above: even with an open window, this
     * admin is skipped when false. Toggleable either from the master admin panel (any admin
     * managing any other admin) or by the admin themselves from their own profile settings —
     * both write this same field. Defaults true so existing/newly-promoted admins keep
     * receiving the campaign unless someone explicitly turns it off. */
    waBroadcastEnabled: { type: Boolean, default: true },
    /** bcrypt hash of an admin-issued 7-digit login code. Never store or return the plain code. */
    loginPinHash: { type: String, default: null },
    /** Bumped whenever a previously-issued JWT should stop being accepted (PIN reset/regenerate)
     * — embedded in the token payload at sign time (lib/jwt.ts) and compared on every
     * requireAuth/optionalAuth check (middleware/auth.ts). Tokens signed before this field
     * existed carry no version claim, which is treated as 0 (this field's default), so
     * already-issued tokens keep working after this change deploys rather than mass-logging-out
     * every active session. */
    tokenVersion: { type: Number, default: 0 },
    /** AES-256-GCM-encrypted (see lib/pinEncryption.ts) 4-digit PIN chosen via the /wa-login
     * self-registration flow — kept only so a "send my code" WhatsApp request can resend the
     * same code instead of rotating it every time. Null for accounts that never went through
     * that flow (admin-provisioned, OTP self-registration); those get a freshly generated
     * 4-digit code on first request, which is then saved here too. Encrypted rather than
     * plaintext because the whole point is reading it back (unlike loginPinHash, which is the
     * actual bcrypt-hashed credential used to authenticate and never needs to be reversed) —
     * a database dump/backup leak should not hand out ready-to-use login codes. Rows written
     * before this field was encrypted are read via decryptPinSafe's plaintext fallback. */
    waLoginPin: { type: String, default: null },
    /** Timestamps of recent mobile+PIN login attempts, for rate-limiting. Trimmed to the
     * current window on each check — kept on User instead of a separate collection since the
     * Atlas cluster is at its collection cap. */
    loginAttempts: { type: [{ type: Date }], default: [] },

    /** Admin-verified identity — surfaced as a discovery/directory trust signal ("Only show
     * verified users"). Distinct from having a valid login: verification is a manual admin
     * action, not automatic on account creation. */
    verified: { type: Boolean, default: false },
    /** Set the moment `mobile` is first attached to this document — distinct from
     * `createdAt`, which for most accounts today is the moment the anonymous session itself
     * was created, potentially long before the visitor ever provides a number. Powers the
     * admin analytics "new vs returning registered users" split (see visitorAnalyticsService),
     * which needs to know when identity was linked, not just when the row was born. Null for
     * an account that's still anonymous. */
    registeredAt: { type: Date, default: null },
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
     * automatically at account creation (see lib/username.ts) and editable from Settings —
     * students choose their own username instead of a separate display name, and it doubles
     * as one (see the pre-save hook below). */
    username: { type: String, default: null, trim: true, lowercase: true, maxlength: 32, unique: true, sparse: true, index: true },
    /** Kept in sync with `username` (see pre-save hook) rather than set independently — the
     * field still exists separately because plenty of read paths (chat/search/community)
     * already select and fall back on it, not because it's ever chosen on its own. */
    displayName: { type: String, default: null, trim: true, maxlength: 40 },
    bio: { type: String, default: "", trim: true, maxlength: 200 },
    interests: { type: [{ type: String, trim: true, maxlength: 40 }], default: [] },
    /** Free-text campus/branch within a college — not a foreign key, since not every college
     * in India runs multiple campuses through this catalog yet. */
    campus: { type: String, default: null, trim: true, maxlength: 120 },
    year: { type: String, default: null, trim: true, maxlength: 20 },
    /** Set once the student has been through the one-time "create your community profile"
     * prompt (choosing their community display name) shown on first visit to Community. False
     * for every pre-existing account too, since that prompt didn't exist before — Mongoose
     * applies this default on read for documents that predate the field, so it surfaces there
     * exactly once, same as a brand-new signup. */
    communityProfileConfigured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

/** Backs the admin dashboard's "active in last 7/30 days" counts (countActiveUsers), which
 * filter on updatedAt — without this, that query is a full collection scan. */
UserSchema.index({ updatedAt: 1 });

/** Username IS the display name — mirrored into displayName on every save (not just when
 * username changes) so every existing read path that selects displayName (chat, search,
 * community member lists) keeps working without also having to select+fallback on username
 * everywhere. Unconditional on purpose: it also self-heals accounts with a legacy custom
 * displayName from before this field stopped being independently editable, the next time that
 * document is saved for any reason, instead of leaving them permanently stale. */
UserSchema.pre("save", function () {
  if (this.username) {
    this.displayName = this.username;
  }
});

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDocument> = models.User || model<UserDocument>("User", UserSchema);
