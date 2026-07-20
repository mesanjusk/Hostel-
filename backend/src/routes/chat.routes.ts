import { createAsyncRouter } from "@/lib/asyncRouter";

import { requireAuth, requireIdentified } from "@/middleware/auth";
import {
  canModerateMessage,
  deleteMessage,
  editMessage,
  getUnreadCount,
  listMessages,
  listPinnedMessages,
  markRead,
  pinMessage,
  reactToMessage,
  searchMessages,
  sendMessage,
} from "@/services/chatService";
import { Message } from "@/models/Message";
import { checkRateLimit } from "@/lib/rateLimiter";
import {
  editMessageSchema,
  listMessagesQuerySchema,
  pinMessageSchema,
  reactSchema,
  searchMessagesQuerySchema,
  sendMessageSchema,
} from "@/validations/chat";
import type { MessageScopeType } from "@/types";

export const chatRouter = createAsyncRouter();

chatRouter.use(requireAuth, requireIdentified);

chatRouter.get("/:scopeType/:scopeId/messages", async (req, res) => {
  const parsed = listMessagesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid query" });
    return;
  }
  const result = await listMessages(req.params.scopeType as MessageScopeType, req.params.scopeId, req.user!._id.toString(), parsed.data);
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json({ messages: result.messages });
});

chatRouter.post("/:scopeType/:scopeId/messages", async (req, res) => {
  if (!checkRateLimit(`msg:${req.user!._id.toString()}`, 20, 10_000)) {
    res.status(429).json({ error: "You're sending messages too fast. Slow down a bit." });
    return;
  }
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await sendMessage({
    scopeType: req.params.scopeType as MessageScopeType,
    scopeId: req.params.scopeId,
    authorId: req.user!._id.toString(),
    body: parsed.data.body,
    attachments: parsed.data.attachments,
    parentMessageId: parsed.data.parentMessageId,
    isAnonymous: parsed.data.isAnonymous,
  });
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ message: result.message });
});

chatRouter.get("/:scopeType/:scopeId/messages/search", async (req, res) => {
  const parsed = searchMessagesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid query" });
    return;
  }
  const result = await searchMessages(req.params.scopeType as MessageScopeType, req.params.scopeId, req.user!._id.toString(), parsed.data.q);
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json({ messages: result.messages });
});

chatRouter.post("/:scopeType/:scopeId/read", async (req, res) => {
  const result = await markRead(req.params.scopeType as MessageScopeType, req.params.scopeId, req.user!._id.toString());
  res.json(result);
});

chatRouter.get("/:scopeType/:scopeId/unread-count", async (req, res) => {
  const count = await getUnreadCount(req.params.scopeType as MessageScopeType, req.params.scopeId, req.user!._id.toString());
  res.json({ count });
});

chatRouter.get("/channels/:channelId/pinned", async (req, res) => {
  const result = await listPinnedMessages(req.params.channelId, req.user!._id.toString());
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json({ messages: result.messages });
});

chatRouter.patch("/messages/:messageId", async (req, res) => {
  const parsed = editMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await editMessage(req.params.messageId, req.user!._id.toString(), parsed.data.body);
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json({ message: result.message });
});

chatRouter.delete("/messages/:messageId", async (req, res) => {
  const result = await deleteMessage(req.params.messageId, req.user!._id.toString());
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json(result);
});

chatRouter.post("/messages/:messageId/react", async (req, res) => {
  const parsed = reactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await reactToMessage(req.params.messageId, req.user!._id.toString(), parsed.data.emoji);
  if (!result.success) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json(result);
});

// PUT with an explicit `pinned` state, not a POST toggle — a toggle isn't idempotent, so a
// client retry on a flaky connection (mobile networks) could double-toggle and undo the very
// state change the user asked for.
chatRouter.put("/messages/:messageId/pin", async (req, res) => {
  const parsed = pinMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const message = await Message.findById(req.params.messageId).lean();
  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  const canModerate = await canModerateMessage(req.params.messageId, req.user!._id.toString());
  if (!canModerate) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const result = await pinMessage(req.params.messageId, parsed.data.pinned);
  res.json(result);
});
