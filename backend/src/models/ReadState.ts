import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { MESSAGE_SCOPE_TYPES } from "@/types";

/** One row per (user, channel-or-conversation) tracking how far they've read — backs unread
 * counters and read receipts for both community channels and DMs. */
const ReadStateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scopeType: { type: String, enum: MESSAGE_SCOPE_TYPES, required: true },
    scopeId: { type: Schema.Types.ObjectId, required: true, index: true },
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ReadStateSchema.index({ userId: 1, scopeType: 1, scopeId: 1 }, { unique: true });

export type ReadStateDocument = InferSchemaType<typeof ReadStateSchema>;

export const ReadState: Model<ReadStateDocument> =
  models.ReadState || model<ReadStateDocument>("ReadState", ReadStateSchema);
