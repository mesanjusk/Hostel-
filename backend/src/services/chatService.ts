import { createHash, randomUUID } from "node:crypto";
import { Types } from "mongoose";

import { connectDB } from "@/db";
import { Message, type MessageDocument } from "@/models/Message";
import { Channel } from "@/models/Channel";
import { CommunityMember } from "@/models/CommunityMember";
import { Conversation } from "@/models/Conversation";
import { ReadState } from "@/models/ReadState";
import { User } from "@/models/User";
import { sanitizeMessageBody, extractMentionedUsernames } from "@/lib/textFilter";
import { serializePublicUser } from "@/services/communityService";
import type { MessageScopeType } from "@/types";
import type { HydratedDocument } from "mongoose";

const ANON_NOUNS = [
  "Panda", "Falcon", "Otter", "Comet", "Fox", "Wolf", "Sparrow", "Tiger", "Phoenix", "Raven",
  "Nomad", "Voyager", "Maverick", "Breeze", "Star", "Explorer",
];

function anonymousAliasFor(scopeId: string, authorId: string): string {
  const hash = createHash("sha256").update(`${scopeId}:${authorId}`).digest();
  return `Anonymous ${ANON_NOUNS[hash[0] % ANON_NOUNS.length]}`;
}

type ScopeAuthResult =
  | { ok: true; communityId?: string; muted?: boolean }
  | { ok: false; error: string };

/** Every message read/write goes through here first: channel messages require an active,
 * non-banned, non-muted community membership; conversation messages require the user to be
 * one of the conversation's members. Centralizing this means the REST routes and the socket
 * layer can't drift out of sync on who's allowed to do what. */
export async function assertScopeAccess(
  scopeType: MessageScopeType,
  scopeId: string,
  userId: string,
): Promise<ScopeAuthResult> {
  await connectDB();
  if (scopeType === "channel") {
    const channel = await Channel.findById(scopeId).lean();
    if (!channel) return { ok: false, error: "Channel not found" };
    const membership = await CommunityMember.findOne({ communityId: channel.communityId, userId }).lean();
    if (!membership || membership.banned) return { ok: false, error: "Not a member of this community" };
    return { ok: true, communityId: channel.communityId.toString(), muted: membership.muted };
  }

  const conversation = await Conversation.findOne({ _id: scopeId, memberIds: userId }).lean();
  if (!conversation) return { ok: false, error: "Not a participant in this conversation" };
  return { ok: true };
}

export interface SendMessageParams {
  scopeType: MessageScopeType;
  scopeId: string;
  authorId: string;
  body: string;
  attachments?: Array<{ type: string; url: string; name?: string; size?: number | null; mimeType?: string | null }>;
  parentMessageId?: string | null;
  isAnonymous?: boolean;
}

export async function sendMessage(params: SendMessageParams) {
  await connectDB();
  const access = await assertScopeAccess(params.scopeType, params.scopeId, params.authorId);
  if (!access.ok) return { success: false as const, error: access.error };
  if (access.muted) return { success: false as const, error: "You're muted in this community" };

  const cleanBody = params.body ? sanitizeMessageBody(params.body) ?? "" : "";
  if (!cleanBody && (!params.attachments || params.attachments.length === 0)) {
    return { success: false as const, error: "Message can't be empty" };
  }

  const mentionedUsernames = extractMentionedUsernames(cleanBody);
  const mentionedUsers = mentionedUsernames.length
    ? await User.find({ username: { $in: mentionedUsernames } }).select("_id").lean()
    : [];

  const isAnonymous = Boolean(params.isAnonymous);
  const message = await Message.create({
    scopeType: params.scopeType,
    scopeId: params.scopeId,
    authorId: params.authorId,
    isAnonymous,
    anonymousAlias: isAnonymous ? anonymousAliasFor(params.scopeId, params.authorId) : null,
    body: cleanBody,
    attachments: params.attachments ?? [],
    mentions: mentionedUsers.map((u) => u._id),
    parentMessageId: params.parentMessageId || null,
  });

  if (params.scopeType === "conversation") {
    await Conversation.findByIdAndUpdate(params.scopeId, {
      lastMessageAt: message.createdAt,
      lastMessagePreview: cleanBody.slice(0, 140) || "[Attachment]",
    });
  }

  const author = await User.findById(params.authorId)
    .select("username displayName avatar college campus city bio interests verified")
    .lean();

  return { success: true as const, message: await serializeMessage(message, author) };
}

async function serializeMessage(
  message: HydratedDocument<MessageDocument> | (MessageDocument & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date }),
  author: Parameters<typeof serializePublicUser>[0] | null,
) {
  return {
    id: message._id.toString(),
    scopeType: message.scopeType,
    scopeId: message.scopeId.toString(),
    author: message.isAnonymous || !author ? null : serializePublicUser(author),
    anonymousAlias: message.isAnonymous ? message.anonymousAlias : null,
    body: message.body,
    attachments: message.attachments,
    mentions: message.mentions.map(String),
    parentMessageId: message.parentMessageId ? message.parentMessageId.toString() : null,
    edited: message.edited,
    pinned: message.pinned,
    reactions: message.reactions.map((r) => ({ emoji: r.emoji, count: r.userIds.length, userIds: r.userIds.map(String) })),
    deleted: Boolean(message.deletedAt),
    createdAt: message.createdAt.toISOString(),
  };
}

export async function listMessages(
  scopeType: MessageScopeType,
  scopeId: string,
  userId: string,
  options: { before?: string; limit: number },
) {
  await connectDB();
  const access = await assertScopeAccess(scopeType, scopeId, userId);
  if (!access.ok) return { success: false as const, error: access.error };

  const query: Record<string, unknown> = { scopeType, scopeId, deletedAt: null };
  if (options.before && Types.ObjectId.isValid(options.before)) {
    query._id = { $lt: new Types.ObjectId(options.before) };
  }

  const messages = await Message.find(query).sort({ _id: -1 }).limit(options.limit).lean();
  const authorIds = [...new Set(messages.filter((m) => !m.isAnonymous).map((m) => m.authorId.toString()))];
  const authors = authorIds.length
    ? await User.find({ _id: { $in: authorIds } })
        .select("username displayName avatar college campus city bio interests verified")
        .lean()
    : [];
  const authorById = new Map(authors.map((a) => [a._id.toString(), a]));

  const serialized = await Promise.all(
    messages.reverse().map((m) => serializeMessage(m, m.isAnonymous ? null : authorById.get(m.authorId.toString()) ?? null)),
  );
  return { success: true as const, messages: serialized };
}

export async function editMessage(messageId: string, userId: string, body: string) {
  await connectDB();
  const message = await Message.findOne({ _id: messageId, deletedAt: null });
  if (!message) return { success: false as const, error: "Message not found" };
  if (message.authorId.toString() !== userId) return { success: false as const, error: "You can only edit your own messages" };

  const cleanBody = sanitizeMessageBody(body);
  if (!cleanBody) return { success: false as const, error: "Message can't be empty" };

  message.body = cleanBody;
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  const author = message.isAnonymous
    ? null
    : await User.findById(userId).select("username displayName avatar college campus city bio interests verified").lean();
  return { success: true as const, message: await serializeMessage(message, author) };
}

/** Resolves whether `userId` can moderate the community a message's channel belongs to,
 * straight from the message itself — never trusts a client-supplied flag, since that would
 * let anyone claim moderator privileges over someone else's message. Conversations (DMs)
 * have no moderator concept: only the author can edit/delete there. */
export async function canModerateMessage(messageId: string, userId: string): Promise<boolean> {
  await connectDB();
  const message = await Message.findById(messageId).lean();
  if (!message || message.scopeType !== "channel") return false;
  const channel = await Channel.findById(message.scopeId).lean();
  if (!channel) return false;
  const membership = await CommunityMember.findOne({ communityId: channel.communityId, userId }).lean();
  return Boolean(membership && ["owner", "admin", "moderator"].includes(membership.role));
}

export async function deleteMessage(messageId: string, userId: string) {
  await connectDB();
  const message = await Message.findOne({ _id: messageId, deletedAt: null });
  if (!message) return { success: false as const, error: "Message not found" };
  const canModerate = message.authorId.toString() !== userId ? await canModerateMessage(messageId, userId) : true;
  if (message.authorId.toString() !== userId && !canModerate) {
    return { success: false as const, error: "Not authorized" };
  }

  message.deletedAt = new Date();
  message.body = "";
  message.attachments.splice(0, message.attachments.length);
  await message.save();
  return { success: true as const, messageId };
}

export async function reactToMessage(messageId: string, userId: string, emoji: string) {
  await connectDB();
  const message = await Message.findOne({ _id: messageId, deletedAt: null });
  if (!message) return { success: false as const, error: "Message not found" };

  const existingReaction = message.reactions.find((r) => r.emoji === emoji);
  const alreadyReacted = existingReaction?.userIds.some((id) => id.toString() === userId);

  if (alreadyReacted && existingReaction) {
    existingReaction.userIds = existingReaction.userIds.filter((id) => id.toString() !== userId) as never;
    message.reactions = message.reactions.filter((r) => r.userIds.length > 0) as never;
  } else if (existingReaction) {
    existingReaction.userIds.push(new Types.ObjectId(userId) as never);
  } else {
    message.reactions.push({ emoji, userIds: [new Types.ObjectId(userId)] } as never);
  }

  await message.save();
  return {
    success: true as const,
    reactions: message.reactions.map((r) => ({ emoji: r.emoji, count: r.userIds.length, userIds: r.userIds.map(String) })),
  };
}

export async function pinMessage(messageId: string, pinned: boolean) {
  await connectDB();
  const message = await Message.findOneAndUpdate({ _id: messageId, deletedAt: null }, { pinned }, { returnDocument: "after" });
  if (!message) return { success: false as const, error: "Message not found" };

  if (message.scopeType === "channel") {
    await Channel.findByIdAndUpdate(message.scopeId, pinned ? { $addToSet: { pinnedMessageIds: message._id } } : { $pull: { pinnedMessageIds: message._id } });
  }
  return { success: true as const };
}

export async function listPinnedMessages(channelId: string) {
  await connectDB();
  const channel = await Channel.findById(channelId).lean();
  if (!channel || !channel.pinnedMessageIds?.length) return [];
  const messages = await Message.find({ _id: { $in: channel.pinnedMessageIds }, deletedAt: null }).lean();
  const authorIds = [...new Set(messages.filter((m) => !m.isAnonymous).map((m) => m.authorId.toString()))];
  const authors = await User.find({ _id: { $in: authorIds } })
    .select("username displayName avatar college campus city bio interests verified")
    .lean();
  const authorById = new Map(authors.map((a) => [a._id.toString(), a]));
  return Promise.all(messages.map((m) => serializeMessage(m, m.isAnonymous ? null : authorById.get(m.authorId.toString()) ?? null)));
}

export async function markRead(scopeType: MessageScopeType, scopeId: string, userId: string) {
  await connectDB();
  await ReadState.findOneAndUpdate(
    { userId, scopeType, scopeId },
    { lastReadAt: new Date() },
    { upsert: true, setDefaultsOnInsert: true },
  );
  return { success: true as const };
}

export async function getUnreadCount(scopeType: MessageScopeType, scopeId: string, userId: string) {
  await connectDB();
  const readState = await ReadState.findOne({ userId, scopeType, scopeId }).lean();
  const since = readState?.lastReadAt ?? new Date(0);
  return Message.countDocuments({ scopeType, scopeId, createdAt: { $gt: since }, deletedAt: null, authorId: { $ne: userId } });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchMessages(scopeType: MessageScopeType, scopeId: string, userId: string, q: string) {
  await connectDB();
  const access = await assertScopeAccess(scopeType, scopeId, userId);
  if (!access.ok) return { success: false as const, error: access.error };

  const regex = new RegExp(escapeRegex(q), "i");
  const messages = await Message.find({ scopeType, scopeId, deletedAt: null, body: regex }).sort({ _id: -1 }).limit(20).lean();
  const authorIds = [...new Set(messages.filter((m) => !m.isAnonymous).map((m) => m.authorId.toString()))];
  const authors = await User.find({ _id: { $in: authorIds } })
    .select("username displayName avatar college campus city bio interests verified")
    .lean();
  const authorById = new Map(authors.map((a) => [a._id.toString(), a]));
  const serialized = await Promise.all(
    messages.map((m) => serializeMessage(m, m.isAnonymous ? null : authorById.get(m.authorId.toString()) ?? null)),
  );
  return { success: true as const, messages: serialized };
}

/** A stable-for-this-process, unique-enough id used as the socket "clientId" echo for optimistic
 * UI dedup — not persisted. */
export function newClientEventId() {
  return randomUUID();
}
