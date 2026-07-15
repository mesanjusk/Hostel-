import { useState } from "react";
import { Heart, Share2, Star, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { PlaceDTO } from "@/features/places/place-dto";

export function PlaceCard({ place, isFavorite: initialFavorite }: { place: PlaceDTO; isFavorite: boolean }) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

  async function toggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      if (next) {
        await api.post(`/api/places/${place.id}/favorite`);
      } else {
        await api.delete(`/api/places/${place.id}/favorite`);
      }
    } catch (error) {
      setIsFavorite(!next);
      toast.error(error instanceof ApiError ? error.message : "Failed to update favourite");
    }
  }

  async function share() {
    const shareData = { title: place.name, text: place.description, url: place.mapsLink ?? window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    toast.success("Link copied to clipboard");
  }

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      {place.imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={place.imageUrl}
            alt={place.name}
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{place.name}</p>
            <Badge variant="outline" className="mt-1">
              {place.category}
            </Badge>
          </div>
          {place.rating != null && (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="fill-warning text-warning size-3.5" />
              {place.rating.toFixed(1)}
            </span>
          )}
        </div>

        {place.address && (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPin className="size-3 shrink-0" /> {place.address}
          </p>
        )}
        {place.openingHours && (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <Clock className="size-3 shrink-0" /> {place.openingHours}
          </p>
        )}
        {place.description && <p className="text-muted-foreground text-sm">{place.description}</p>}

        <div className="mt-2 flex items-center gap-2">
          {place.mapsLink && (
            <Button asChild size="sm" variant="outline">
              <a href={place.mapsLink} target="_blank" rel="noreferrer">
                View on Maps
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={toggleFavorite}>
            <Heart className={isFavorite ? "fill-destructive text-destructive size-4" : "size-4"} />
          </Button>
          <Button size="sm" variant="ghost" onClick={share}>
            <Share2 className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
