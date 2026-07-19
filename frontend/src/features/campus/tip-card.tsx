import { useState } from "react";
import { ArrowBigDown, ArrowBigUp, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toCampusTipDTO, type CampusTipDTO, type CampusTipRaw } from "@/features/campus/campus-tip-dto";
import { TipFormDialog } from "@/features/campus/tip-form-dialog";

export function TipCard({ tip: initialTip, onDeleted }: { tip: CampusTipDTO; onDeleted: (id: string) => void }) {
  const [tip, setTip] = useState(initialTip);

  /** Clicking the side you're already on retracts the vote; clicking the other side switches.
   * Optimistic with rollback — same pattern as PlaceCard.toggleFavorite. */
  async function vote(side: "up" | "down") {
    const direction = tip.myVote === side ? "none" : side;
    const before = tip;
    setTip(applyVote(tip, direction));
    try {
      const { tip: raw } = await api.post<{ tip: CampusTipRaw }>(`/api/campus-tips/${tip.id}/vote`, { direction });
      setTip(toCampusTipDTO(raw));
    } catch (error) {
      setTip(before);
      toast.error(error instanceof ApiError ? error.message : "Failed to save vote");
    }
  }

  async function remove() {
    try {
      await api.delete(`/api/campus-tips/${tip.id}`);
      onDeleted(tip.id);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete tip");
    }
  }

  const score = tip.upvotes - tip.downvotes;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline">{tip.category}</Badge>
        {tip.isMine && (
          <div className="flex gap-1">
            <TipFormDialog
              college={tip.college}
              tip={tip}
              onSaved={(updated) => setTip(updated)}
              trigger={
                <Button size="sm" variant="ghost" aria-label="Edit tip">
                  <Pencil className="size-3.5" />
                </Button>
              }
            />
            <Button size="sm" variant="ghost" aria-label="Delete tip" onClick={remove}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm">{tip.text}</p>

      {tip.imageUrl && (
        <img
          src={tip.imageUrl}
          alt=""
          className="max-h-48 w-full rounded-md object-cover"
        />
      )}

      {tip.linkUrl && (
        <a
          href={tip.linkUrl}
          target="_blank"
          rel="noreferrer"
          className="text-primary flex items-center gap-1 text-xs hover:underline"
        >
          <ExternalLink className="size-3 shrink-0" /> {tip.linkUrl}
        </a>
      )}

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
          <Avatar className="size-5">
            <AvatarImage src={tip.authorAvatar ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {(tip.authorName ?? "S").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{tip.authorName ?? "A student"}</span>
          <span className="shrink-0">· {formatDistanceToNow(new Date(tip.createdAt), { addSuffix: true })}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" variant="ghost" aria-label="Upvote" onClick={() => vote("up")}>
            <ArrowBigUp className={cn("size-4", tip.myVote === "up" && "fill-primary text-primary")} />
          </Button>
          <span className="min-w-6 text-center text-sm font-medium tabular-nums">{score}</span>
          <Button size="sm" variant="ghost" aria-label="Downvote" onClick={() => vote("down")}>
            <ArrowBigDown className={cn("size-4", tip.myVote === "down" && "fill-destructive text-destructive")} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function applyVote(tip: CampusTipDTO, direction: "up" | "down" | "none"): CampusTipDTO {
  return {
    ...tip,
    upvotes: tip.upvotes + (direction === "up" ? 1 : 0) - (tip.myVote === "up" ? 1 : 0),
    downvotes: tip.downvotes + (direction === "down" ? 1 : 0) - (tip.myVote === "down" ? 1 : 0),
    myVote: direction === "none" ? null : direction,
  };
}
