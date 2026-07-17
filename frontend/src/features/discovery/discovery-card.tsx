import { useState } from "react";
import { BadgeCheck, MapPin, Calendar, GraduationCap, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { ConnectionContext, DiscoveryCardDTO } from "@/features/discovery/discovery-dto";

export function DiscoveryCard({ card, context }: { card: DiscoveryCardDTO; context: ConnectionContext }) {
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [sending, setSending] = useState(false);

  async function handleConnect() {
    setSending(true);
    try {
      await api.post("/api/discovery/connections", { recipientId: card.userId, context });
      setStatus("sent");
      toast.success("Request sent");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to send request");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-12">
          <AvatarImage src={card.avatar ?? undefined} />
          <AvatarFallback>{(card.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{card.name ?? "Student"}</p>
            {card.verified && <BadgeCheck className="text-primary size-4 shrink-0" />}
          </div>
          {card.college && (
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              <GraduationCap className="size-3" /> {card.college}
            </p>
          )}
        </div>
        {card.compatibilityScore != null && (
          <Badge variant="accent">{card.compatibilityScore}% match</Badge>
        )}
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1">
          <MapPin className="size-3" />
          {card.currentCity} → {card.destinationCity}
        </span>
        {/* Dates are a co-packer concern: that match is built on travelling together, so when
            someone arrives is the point. Roommate matching ignores travel month and arrival
            date entirely, so showing them here would only invite a judgement the match didn't
            make. */}
        {context === "co_packer" &&
          (card.arrivalDate ? (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(card.arrivalDate).toLocaleDateString()}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {card.travelMonth}
            </span>
          ))}
        {card.accommodationType && <Badge variant="outline">{card.accommodationType}</Badge>}
        {context === "roommate" && card.budgetMin != null && card.budgetMax != null && (
          <span>
            ₹{card.budgetMin.toLocaleString("en-IN")}–{card.budgetMax.toLocaleString("en-IN")}/mo
          </span>
        )}
      </div>

      {(card.interests.length > 0 || card.languages.length > 0 || card.lifestyleTags.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {[...card.interests, ...card.languages, ...card.lifestyleTags].slice(0, 6).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Button size="sm" onClick={handleConnect} disabled={status === "sent" || sending} className="self-start">
        {status === "sent" ? <Check className="size-4" /> : <UserPlus className="size-4" />}
        {status === "sent" ? "Request sent" : "Connect"}
      </Button>
    </Card>
  );
}
