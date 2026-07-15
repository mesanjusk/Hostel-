import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatWindow } from "@/features/community/chat-window";
import { listConversations } from "@/features/community/community-api";
import { ApiError } from "@/lib/api";
import type { ConversationDTO } from "@/types";

export function ConversationView() {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<ConversationDTO | null>(null);

  useEffect(() => {
    if (!id) return;
    listConversations()
      .then(({ conversations }) => setConversation(conversations.find((c) => c.id === id) ?? null))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load conversation"));
  }, [id]);

  if (!id) return null;

  const other = conversation?.members[0];
  const title = conversation?.type === "group" ? conversation.name || "Group chat" : other?.displayName || "Student";

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col gap-3 lg:h-[calc(100dvh-6rem)]">
      <div className="flex items-center gap-2.5">
        <Link to="/chat" className="lg:hidden">
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar className="size-9">
          <AvatarImage src={other?.avatar ?? undefined} />
          <AvatarFallback>{title.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-display font-semibold">{title}</p>
          {other?.username && <p className="text-muted-foreground truncate text-xs">@{other.username}</p>}
        </div>
      </div>
      <div className="min-h-0 flex-1 rounded-2xl border border-border/70">
        <ChatWindow scopeType="conversation" scopeId={id} />
      </div>
    </div>
  );
}
