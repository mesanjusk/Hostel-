import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { CONVERSATION_TYPES } from "@/types";

/** A direct message (1:1) or small group chat, independent of any Community. */
const ConversationSchema = new Schema(
  {
    type: { type: String, enum: CONVERSATION_TYPES, required: true },
    memberIds: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], required: true, index: true },
    name: { type: String, default: null, trim: true, maxlength: 80 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** Sorted, joined member-id pair — only set for type "dm", used to enforce one conversation
     * per pair of students instead of a slower $all/$size query on every DM open. */
    dmKey: { type: String, default: null, index: true },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessagePreview: { type: String, default: "", maxlength: 140 },
  },
  { timestamps: true },
);

ConversationSchema.index({ dmKey: 1 }, { unique: true, partialFilterExpression: { dmKey: { $type: "string" } } });
// Inbox listing: "my conversations, most recently active first."
ConversationSchema.index({ memberIds: 1, lastMessageAt: -1 });

export type ConversationDocument = InferSchemaType<typeof ConversationSchema>;

export const Conversation: Model<ConversationDocument> =
  models.Conversation || model<ConversationDocument>("Conversation", ConversationSchema);
