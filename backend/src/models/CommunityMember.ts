import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { COMMUNITY_ROLES } from "@/types";

const CommunityMemberSchema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: COMMUNITY_ROLES, default: "member" },
    muted: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// "Am I in this community, and with what role" — the hot-path check on every channel/message
// request — plus dedupe so join is idempotent.
CommunityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
// "List my communities" (community hub) and "list this community's members by role" (admin panel).
CommunityMemberSchema.index({ userId: 1 });
CommunityMemberSchema.index({ communityId: 1, role: 1 });

export type CommunityMemberDocument = InferSchemaType<typeof CommunityMemberSchema>;

export const CommunityMember: Model<CommunityMemberDocument> =
  models.CommunityMember || model<CommunityMemberDocument>("CommunityMember", CommunityMemberSchema);
