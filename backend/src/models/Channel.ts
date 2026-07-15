import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { CHANNEL_TYPES } from "@/types";

/** A chat room within a Community — every community gets a default set (general,
 * announcements, marketplace, events, lost-found) on creation; members with permission can
 * add custom ones (Study Groups, Sports, Gaming, ...). */
const ChannelSchema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
    type: { type: String, enum: CHANNEL_TYPES, default: "text" },
    topic: { type: String, default: "", trim: true, maxlength: 200 },
    isDefault: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    allowAnonymous: { type: Boolean, default: false },
    pinnedMessageIds: { type: [{ type: Schema.Types.ObjectId, ref: "Message" }], default: [] },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ChannelSchema.index({ communityId: 1, slug: 1 }, { unique: true });
ChannelSchema.index({ communityId: 1, order: 1 });

export type ChannelDocument = InferSchemaType<typeof ChannelSchema>;

export const Channel: Model<ChannelDocument> = models.Channel || model<ChannelDocument>("Channel", ChannelSchema);
