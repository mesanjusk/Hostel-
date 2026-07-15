import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, MoreVertical, Music, Pencil, Pin, Reply, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MessageDTO } from "@/types";

const QUICK_EMOJI = ["👍", "❤️", "😂", "😮", "🙏"];

function AttachmentPreview({ attachment }: { attachment: MessageDTO["attachments"][number] }) {
  if (attachment.type === "image") {
    return (
      <img
        src={attachment.url}
        alt={attachment.name || "Image"}
        className="max-h-64 max-w-full rounded-xl object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }
  if (attachment.type === "video") {
    return <video src={attachment.url} controls className="max-h-64 max-w-full rounded-xl" />;
  }
  if (attachment.type === "audio") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2">
        <Music className="size-4 shrink-0" />
        <audio src={attachment.url} controls className="h-9 max-w-full" />
      </div>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm hover:bg-muted/60"
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate">{attachment.name || "Document"}</span>
    </a>
  );
}

export function MessageBubble({
  message,
  isOwn,
  canModerate,
  onReact,
  onDelete,
  onEdit,
  onReply,
  onPin,
}: {
  message: MessageDTO;
  isOwn: boolean;
  canModerate: boolean;
  onReact: (emoji: string) => void;
  onDelete: () => void;
  onEdit: (body: string) => void;
  onReply: () => void;
  onPin?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);

  const name = message.anonymousAlias ?? message.author?.displayName ?? "Student";
  const handle = message.anonymousAlias ? null : message.author?.username ? `@${message.author.username}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("group flex gap-2.5 px-1 py-1.5", isOwn && "flex-row-reverse")}
    >
      <Avatar className="size-8 shrink-0">
        {!message.anonymousAlias && <AvatarImage src={message.author?.avatar ?? undefined} />}
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[80%] min-w-0 flex-col gap-1", isOwn && "items-end")}>
        <div className="flex items-baseline gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{name}</span>
          {handle && <span>{handle}</span>}
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {message.pinned && <Pin className="size-3" />}
        </div>

        {editing ? (
          <div className="flex w-full flex-col gap-1.5">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-16 text-sm" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { onEdit(draft); setEditing(false); }}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm break-words",
              isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {message.body}
            {message.edited && <span className="ml-1 text-[10px] opacity-70">(edited)</span>}
          </div>
        )}

        {message.attachments.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {message.attachments.map((a, i) => (
              <AttachmentPreview key={i} attachment={a} />
            ))}
          </div>
        )}

        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(r.emoji)}
                className="flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-0.5 text-xs hover:bg-muted"
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {QUICK_EMOJI.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              className="rounded-full px-1 text-sm hover:bg-muted"
              aria-label={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <Button variant="ghost" size="icon" className="size-6" onClick={onReply} aria-label="Reply">
            <Reply className="size-3.5" />
          </Button>
          {(isOwn || canModerate) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6" aria-label="More">
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                {isOwn && (
                  <DropdownMenuItem onClick={() => setEditing(true)}>
                    <Pencil className="size-3.5" /> Edit
                  </DropdownMenuItem>
                )}
                {onPin && (
                  <DropdownMenuItem onClick={onPin}>
                    <Pin className="size-3.5" /> {message.pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDelete} variant="destructive">
                  <Trash2 className="size-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.div>
  );
}
