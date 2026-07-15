import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NewDmDialog } from "@/features/chat/new-dm-dialog";
import { listConversations } from "@/features/community/community-api";
import { ApiError } from "@/lib/api";
import type { ConversationDTO } from "@/types";

export function ConversationListView() {
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listConversations()
      .then(({ conversations }) => setConversations(conversations))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load messages"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Messages" description="Direct messages with other students" action={<NewDmDialog />} />

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No conversations yet" description="Start a chat with another student by their username." />
      ) : (
        <div className="flex flex-col gap-1">
          {conversations.map((c) => {
            const other = c.members[0];
            const title = c.type === "group" ? c.name || "Group chat" : other?.displayName || "Student";
            return (
              <Link key={c.id} to={`/chat/${c.id}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted">
                <Avatar className="size-11">
                  <AvatarImage src={other?.avatar ?? undefined} />
                  <AvatarFallback>{title.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{title}</p>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {new Date(c.lastMessageAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate text-sm">{c.lastMessagePreview || "No messages yet"}</p>
                </div>
                {c.unreadCount > 0 && <Badge variant="accent">{c.unreadCount}</Badge>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
