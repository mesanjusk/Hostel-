import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";

import { verifyAuthToken } from "@/lib/jwt";
import { connectDB } from "@/db";
import { User } from "@/models/User";
import { checkRateLimit } from "@/lib/rateLimiter";
import {
  assertScopeAccess,
  canModerateMessage,
  deleteMessage,
  editMessage,
  markRead,
  pinMessage,
  reactToMessage,
  sendMessage,
} from "@/services/chatService";
import type { MessageScopeType } from "@/types";

interface AuthedSocket extends Socket {
  data: { userId: string };
}

function roomName(scopeType: MessageScopeType, scopeId: string) {
  return `${scopeType}:${scopeId}`;
}

// In-memory presence: fine for this app's single Render instance. A multi-instance deploy
// would need this backed by a shared store (Redis) so "who's online" is consistent across
// processes — noted here rather than built, since the current deployment is single-instance.
const onlineUsers = new Map<string, number>();

function markOnline(io: Server, userId: string) {
  onlineUsers.set(userId, (onlineUsers.get(userId) ?? 0) + 1);
  if (onlineUsers.get(userId) === 1) {
    io.emit("presence:online", { userId });
  }
}

function markOffline(io: Server, userId: string) {
  const count = (onlineUsers.get(userId) ?? 1) - 1;
  if (count <= 0) {
    onlineUsers.delete(userId);
    io.emit("presence:offline", { userId });
  } else {
    onlineUsers.set(userId, count);
  }
}

export function initSocketServer(httpServer: HttpServer) {
  const allowedOrigins = (process.env.CORS_ORIGIN ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  const vercelPreview = /^https:\/\/hostel-jsk8(-[a-z0-9-]+)?\.vercel\.app$/;

  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || vercelPreview.test(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin not allowed"));
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Not authenticated"));
      const payload = verifyAuthToken(token);
      await connectDB();
      const user = await User.findById(payload.sub).select("_id").lean();
      if (!user) return next(new Error("Not authenticated"));
      (socket as AuthedSocket).data.userId = user._id.toString();
      next();
    } catch {
      next(new Error("Not authenticated"));
    }
  });

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AuthedSocket;
    const userId = socket.data.userId;
    markOnline(io, userId);
    socket.join(`user:${userId}`);

    socket.on("scope:join", async (payload: { scopeType: MessageScopeType; scopeId: string }, ack?: (res: unknown) => void) => {
      const access = await assertScopeAccess(payload.scopeType, payload.scopeId, userId);
      if (!access.ok) {
        ack?.({ success: false, error: access.error });
        return;
      }
      socket.join(roomName(payload.scopeType, payload.scopeId));
      ack?.({ success: true });
    });

    socket.on("scope:leave", (payload: { scopeType: MessageScopeType; scopeId: string }) => {
      socket.leave(roomName(payload.scopeType, payload.scopeId));
    });

    socket.on(
      "message:send",
      async (
        payload: {
          scopeType: MessageScopeType;
          scopeId: string;
          body: string;
          attachments?: Array<{ type: string; url: string; name?: string; size?: number | null; mimeType?: string | null }>;
          parentMessageId?: string | null;
          isAnonymous?: boolean;
        },
        ack?: (res: unknown) => void,
      ) => {
        if (!checkRateLimit(`msg:${userId}`, 20, 10_000)) {
          ack?.({ success: false, error: "You're sending messages too fast. Slow down a bit." });
          return;
        }

        const result = await sendMessage({
          scopeType: payload.scopeType,
          scopeId: payload.scopeId,
          authorId: userId,
          body: payload.body,
          attachments: payload.attachments,
          parentMessageId: payload.parentMessageId,
          isAnonymous: payload.isAnonymous,
        });

        if (!result.success) {
          ack?.({ success: false, error: result.error });
          return;
        }

        io.to(roomName(payload.scopeType, payload.scopeId)).emit("message:new", result.message);
        if (payload.scopeType === "conversation") {
          // Deliver to each member's personal room too, so an inbox list open on another
          // screen (not currently viewing this conversation) still updates in real time.
          io.to(roomName(payload.scopeType, payload.scopeId)).emit("conversation:updated", { conversationId: payload.scopeId });
        }
        ack?.({ success: true, message: result.message });
      },
    );

    socket.on("message:edit", async (payload: { messageId: string; body: string }, ack?: (res: unknown) => void) => {
      const result = await editMessage(payload.messageId, userId, payload.body);
      if (!result.success) {
        ack?.({ success: false, error: result.error });
        return;
      }
      io.to(roomName(result.message.scopeType as MessageScopeType, result.message.scopeId)).emit("message:edited", result.message);
      ack?.({ success: true });
    });

    socket.on(
      "message:delete",
      async (payload: { messageId: string; scopeType: MessageScopeType; scopeId: string }, ack?: (res: unknown) => void) => {
        // Authorization is resolved server-side from the message + the caller's own community
        // role — a client-supplied "I'm a moderator" flag would let anyone delete anyone's
        // message, so deleteMessage never accepts one.
        const result = await deleteMessage(payload.messageId, userId);
        if (!result.success) {
          ack?.({ success: false, error: result.error });
          return;
        }
        io.to(roomName(payload.scopeType, payload.scopeId)).emit("message:deleted", { messageId: payload.messageId });
        ack?.({ success: true });
      },
    );

    socket.on(
      "message:pin",
      async (payload: { messageId: string; scopeType: MessageScopeType; scopeId: string; pinned: boolean }, ack?: (res: unknown) => void) => {
        const allowed = await canModerateMessage(payload.messageId, userId);
        if (!allowed) {
          ack?.({ success: false, error: "Not authorized" });
          return;
        }
        const result = await pinMessage(payload.messageId, payload.pinned);
        io.to(roomName(payload.scopeType, payload.scopeId)).emit("message:pinned", { messageId: payload.messageId, pinned: payload.pinned });
        ack?.(result);
      },
    );

    socket.on("message:react", async (payload: { messageId: string; scopeType: MessageScopeType; scopeId: string; emoji: string }, ack?: (res: unknown) => void) => {
      const result = await reactToMessage(payload.messageId, userId, payload.emoji);
      if (!result.success) {
        ack?.({ success: false, error: result.error });
        return;
      }
      io.to(roomName(payload.scopeType, payload.scopeId)).emit("message:reacted", { messageId: payload.messageId, reactions: result.reactions });
      ack?.({ success: true });
    });

    socket.on("typing:start", (payload: { scopeType: MessageScopeType; scopeId: string }) => {
      socket.to(roomName(payload.scopeType, payload.scopeId)).emit("typing:start", { userId, ...payload });
    });

    socket.on("typing:stop", (payload: { scopeType: MessageScopeType; scopeId: string }) => {
      socket.to(roomName(payload.scopeType, payload.scopeId)).emit("typing:stop", { userId, ...payload });
    });

    socket.on("read:mark", async (payload: { scopeType: MessageScopeType; scopeId: string }) => {
      await markRead(payload.scopeType, payload.scopeId, userId);
      socket.to(roomName(payload.scopeType, payload.scopeId)).emit("read:receipt", { userId, ...payload, at: new Date().toISOString() });
    });

    socket.on("disconnect", () => {
      markOffline(io, userId);
    });
  });

  return io;
}

export type { AuthedSocket };
