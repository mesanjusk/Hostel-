import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { ATTACHMENT_TYPES, MESSAGE_SCOPE_TYPES } from "@/types";

const AttachmentSchema = new Schema(
  {
    type: { type: String, enum: ATTACHMENT_TYPES, required: true },
    url: { type: String, required: true },
    name: { type: String, default: "", maxlength: 200 },
    size: { type: Number, default: null },
    mimeType: { type: String, default: null },
  },
  { _id: false },
);

const ReactionSchema = new Schema(
  {
    emoji: { type: String, required: true, maxlength: 8 },
    userIds: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
  },
  { _id: false },
);

/** A single chat message, scoped to either a Channel (community chat) or a Conversation
 * (DM/group). One collection for both keeps pagination/search/reactions/threads identical
 * regardless of where the message lives — the only difference is which id `scopeId` points at. */
const MessageSchema = new Schema(
  {
    scopeType: { type: String, enum: MESSAGE_SCOPE_TYPES, required: true },
    scopeId: { type: Schema.Types.ObjectId, required: true, index: true },
    /** Always the real author, even for anonymous posts — never omitted, so moderation can
     * always trace identity. Serializers strip this from the public payload when isAnonymous
     * is true (see chatService.serializeMessage). */
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isAnonymous: { type: Boolean, default: false },
    /** Stable per-thread alias shown instead of the username when isAnonymous, e.g.
     * "Anonymous Panda" — same author gets the same alias within one scope so a thread reads
     * coherently without revealing who's who across scopes. */
    anonymousAlias: { type: String, default: null },
    body: { type: String, default: "", maxlength: 4000 },
    attachments: { type: [AttachmentSchema], default: [] },
    mentions: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    parentMessageId: { type: Schema.Types.ObjectId, ref: "Message", default: null, index: true },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    pinned: { type: Boolean, default: false },
    reactions: { type: [ReactionSchema], default: [] },
  },
  { timestamps: true },
);

// Primary hot path: paginate a channel/conversation's messages newest-first.
MessageSchema.index({ scopeType: 1, scopeId: 1, createdAt: -1 });
MessageSchema.index({ scopeType: 1, scopeId: 1, pinned: 1 });
MessageSchema.index({ body: "text" });

export type MessageDocument = InferSchemaType<typeof MessageSchema>;

export const Message: Model<MessageDocument> = models.Message || model<MessageDocument>("Message", MessageSchema);
