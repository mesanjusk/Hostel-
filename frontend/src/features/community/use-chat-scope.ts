import { useCallback, useEffect, useRef, useState } from "react";

import { getSocket } from "@/lib/socket";
import { listMessages, markScopeRead, sendMessageRest } from "@/features/community/community-api";
import { ApiError } from "@/lib/api";
import type { MessageDTO, MessageScopeType } from "@/types";

interface SendOptions {
  attachments?: MessageDTO["attachments"];
  parentMessageId?: string | null;
  isAnonymous?: boolean;
}

interface SocketAck {
  success: boolean;
  error?: string;
}

/** Drives one channel or conversation's chat: loads history over REST, then joins the
 * matching Socket.IO room for live updates (new/edited/deleted messages, reactions, typing).
 * Shared by community channel chat and DM chat — the two only differ in `scopeType`. */
export function useChatScope(scopeType: MessageScopeType, scopeId: string | null) {
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!scopeId) return;
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    setTypingUserIds([]);

    listMessages(scopeType, scopeId)
      .then(({ messages }) => {
        if (!cancelled) setMessages(messages);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load messages");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    markScopeRead(scopeType, scopeId).catch(() => {});

    const socket = getSocket();
    if (!socket) return () => { cancelled = true; };

    socket.emit("scope:join", { scopeType, scopeId });

    const onNew = (msg: MessageDTO) => {
      if (msg.scopeId !== scopeId || msg.scopeType !== scopeType) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      markScopeRead(scopeType, scopeId).catch(() => {});
    };
    const onEdited = (msg: MessageDTO) => {
      if (msg.scopeId !== scopeId) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    };
    const onDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };
    const onReacted = ({ messageId, reactions }: { messageId: string; reactions: MessageDTO["reactions"] }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    };
    const onPinned = ({ messageId, pinned }: { messageId: string; pinned: boolean }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, pinned } : m)));
    };
    const onTypingStart = (payload: { userId: string; scopeId: string }) => {
      if (payload.scopeId !== scopeId) return;
      setTypingUserIds((prev) => (prev.includes(payload.userId) ? prev : [...prev, payload.userId]));
    };
    const onTypingStop = (payload: { userId: string; scopeId: string }) => {
      if (payload.scopeId !== scopeId) return;
      setTypingUserIds((prev) => prev.filter((id) => id !== payload.userId));
    };

    socket.on("message:new", onNew);
    socket.on("message:edited", onEdited);
    socket.on("message:deleted", onDeleted);
    socket.on("message:reacted", onReacted);
    socket.on("message:pinned", onPinned);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    return () => {
      cancelled = true;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      socket.emit("scope:leave", { scopeType, scopeId });
      socket.off("message:new", onNew);
      socket.off("message:edited", onEdited);
      socket.off("message:deleted", onDeleted);
      socket.off("message:reacted", onReacted);
      socket.off("message:pinned", onPinned);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [scopeType, scopeId]);

  const send = useCallback(
    async (body: string, opts: SendOptions = {}) => {
      if (!scopeId) return;
      const socket = getSocket();
      if (socket?.connected) {
        await new Promise<void>((resolve, reject) => {
          socket.emit("message:send", { scopeType, scopeId, body, ...opts }, (ack: SocketAck) => {
            if (ack.success) resolve();
            else reject(new Error(ack.error ?? "Failed to send"));
          });
        });
        return;
      }
      await sendMessageRest(scopeType, scopeId, { body, ...opts });
    },
    [scopeType, scopeId],
  );

  const react = useCallback(
    (messageId: string, emoji: string) => {
      const socket = getSocket();
      socket?.emit("message:react", { messageId, scopeType, scopeId, emoji });
    },
    [scopeType, scopeId],
  );

  const remove = useCallback(
    (messageId: string) => {
      // Who's actually allowed to delete is resolved server-side from the message's own
      // community role — nothing client-supplied is trusted for that decision.
      const socket = getSocket();
      socket?.emit("message:delete", { messageId, scopeType, scopeId });
    },
    [scopeType, scopeId],
  );

  const edit = useCallback((messageId: string, body: string) => {
    const socket = getSocket();
    socket?.emit("message:edit", { messageId, body });
  }, []);

  const togglePin = useCallback(
    (messageId: string, pinned: boolean) => {
      const socket = getSocket();
      socket?.emit("message:pin", { messageId, scopeType, scopeId, pinned });
    },
    [scopeType, scopeId],
  );

  const notifyTyping = useCallback(() => {
    if (!scopeId) return;
    const socket = getSocket();
    socket?.emit("typing:start", { scopeType, scopeId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing:stop", { scopeType, scopeId });
    }, 3000);
  }, [scopeType, scopeId]);

  return { messages, loading, error, typingUserIds, send, react, remove, edit, togglePin, notifyTyping };
}
