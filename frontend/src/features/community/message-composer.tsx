import { useRef, useState } from "react";
import { toast } from "sonner";
import { Paperclip, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { compressImageToDataUrl } from "@/lib/image-compression";
import { uploadChatFile } from "@/features/community/community-api";
import { ApiError } from "@/lib/api";
import type { MessageDTO } from "@/types";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function MessageComposer({
  onSend,
  onTyping,
  allowAnonymous,
  replyTo,
  onCancelReply,
}: {
  onSend: (body: string, opts: { attachments?: MessageDTO["attachments"]; parentMessageId?: string | null; isAnonymous?: boolean }) => Promise<void>;
  onTyping: () => void;
  allowAnonymous?: boolean;
  replyTo?: MessageDTO | null;
  onCancelReply?: () => void;
}) {
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<MessageDTO["attachments"][number] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File is too large (max 20MB)");
      return;
    }
    setUploading(true);
    try {
      const dataUri = file.type.startsWith("image/") ? await compressImageToDataUrl(file) : await readFileAsDataUrl(file);
      const { attachment } = await uploadChatFile(dataUri, file.name);
      setPendingAttachment(attachment);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to attach file");
    } finally {
      setUploading(false);
    }
  }

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed && !pendingAttachment) return;
    setSending(true);
    try {
      await onSend(trimmed, {
        attachments: pendingAttachment ? [pendingAttachment] : undefined,
        parentMessageId: replyTo?.id ?? null,
        isAnonymous,
      });
      setBody("");
      setPendingAttachment(null);
      onCancelReply?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-border/70 bg-background p-3">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
          <span className="truncate text-muted-foreground">
            Replying to <span className="font-medium text-foreground">{replyTo.anonymousAlias ?? replyTo.author?.displayName ?? "message"}</span>
          </span>
          <button onClick={onCancelReply} aria-label="Cancel reply">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {pendingAttachment && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
          <span className="truncate">{pendingAttachment.name || pendingAttachment.type}</span>
          <button onClick={() => setPendingAttachment(null)} aria-label="Remove attachment">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
        >
          <Paperclip className="size-4" />
        </Button>
        <Textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Message..."
          className="min-h-11 flex-1 resize-none py-2.5"
        />
        <Button size="icon" className="shrink-0" onClick={handleSend} disabled={sending || uploading} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </div>

      {allowAnonymous && (
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} className="scale-75" />
          Post anonymously
        </label>
      )}
    </div>
  );
}
