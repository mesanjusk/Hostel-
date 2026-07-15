import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { COMMUNITY_ROLES, COMMUNITY_TYPES, COMMUNITY_VISIBILITY } from "@/types";

/** A community node in the Country > State > City > College > Campus > Course > Year hierarchy,
 * plus flat categories (marketplace/events/lost_found/interest/custom). Nothing here is
 * hardcoded to any institution — `scopeKey` is derived at runtime from whatever college/city/
 * course a student's own profile names (see communityService.ensureAutoJoinCommunities), so
 * every Indian college/course/city is supported the moment a student names it, without a
 * pre-seeded directory. */
const CommunitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 140, unique: true },
    type: { type: String, enum: COMMUNITY_TYPES, required: true, index: true },
    /** Normalized matching key for auto-join dedup, e.g. lowercased city/college name, a
     * courseId string, "india" for the country root, or an interest tag. Null for one-off
     * custom communities that aren't auto-joined by anyone. */
    scopeKey: { type: String, default: null, trim: true, lowercase: true, maxlength: 160 },
    parentId: { type: Schema.Types.ObjectId, ref: "Community", default: null, index: true },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    icon: { type: String, default: null },
    visibility: { type: String, enum: COMMUNITY_VISIBILITY, default: "public" },
    isOfficial: { type: Boolean, default: false },
    /** Lets moderators enable identity-hidden posting in this community's channels — see
     * Message.isAnonymous. Admins can always trace the real author for moderation. */
    allowAnonymous: { type: Boolean, default: false },
    /** Denormalized counter, incremented/decremented atomically on join/leave — avoids a
     * COUNT(*) over CommunityMember every time a community card renders. */
    memberCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    defaultRole: { type: String, enum: COMMUNITY_ROLES, default: "member" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

// Primary auto-join lookup: "does a community of this type+scope already exist" — must be
// fast and must prevent duplicate creation under concurrent registrations.
CommunitySchema.index({ type: 1, scopeKey: 1 }, { unique: true, partialFilterExpression: { scopeKey: { $type: "string" } } });
// Discovery/browse listing, newest official communities first within a type.
CommunitySchema.index({ visibility: 1, active: 1, type: 1, memberCount: -1 });
CommunitySchema.index({ name: "text", description: "text" });

export type CommunityDocument = InferSchemaType<typeof CommunitySchema>;

export const Community: Model<CommunityDocument> =
  models.Community || model<CommunityDocument>("Community", CommunitySchema);
