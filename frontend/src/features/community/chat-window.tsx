import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useChatScope } from "@/features/community/use-chat-scope";
import { MessageBubble } from "@/features/community/message-bubble";
import { MessageComposer } from "@/features/community/message-composer";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageCircle } from "lucide-react";
import type { MessageDTO, MessageScopeType } from "@/types";

export function ChatWindow({
  scopeType,
  scopeId,
  allowAnonymous,
  canModerate,
}: {
  scopeType: MessageScopeType;
  scopeId: string;
  allowAnonymous?: boolean;
  canModerate?: boolean;
}) {
  const { user } = useAuth();
  const { messages, loading, typingUserIds, send, react, remove, edit, togglePin, notifyTyping } = useChatScope(scopeType, scopeId);
  const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No messages yet" description="Be the first to say something." />
        ) : (
          <div className="flex flex-col">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.author?.id === user?.id}
                canModerate={Boolean(canModerate)}
                onReact={(emoji) => react(message.id, emoji)}
                onDelete={() => remove(message.id)}
                onEdit={(body) => edit(message.id, body)}
                onReply={() => setReplyTo(message)}
                onPin={scopeType === "channel" && canModerate ? () => togglePin(message.id, !message.pinned) : undefined}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
        {typingUserIds.length > 0 && (
          <p className="text-muted-foreground px-2 pt-1 text-xs italic">
            {typingUserIds.length === 1 ? "Someone is typing…" : `${typingUserIds.length} people are typing…`}
          </p>
        )}
      </div>
      <MessageComposer
        onSend={send}
        onTyping={notifyTyping}
        allowAnonymous={allowAnonymous}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
