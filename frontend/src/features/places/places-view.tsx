import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, Heart } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { PLACE_CATEGORIES } from "@/types";
import { PlaceCard } from "@/features/places/place-card";
import { toPlaceDTO, type PlaceDTO, type PlaceRaw } from "@/features/places/place-dto";

const ANY = "__any__";

/** @param city - The student's destination city, taken directly from their travel profile.
 * There's no picker any more: Explore is meant to show the one city that's actually relevant,
 * not let a student browse the whole country. Blank (no travel profile / no destination city
 * saved yet) shows an actionable empty state instead of an empty picker. */
export function PlacesView({ city }: { city: string }) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  // null (not []) until the first fetch for the current view resolves, so the page doesn't
  // flash "No places found" before the real data arrives — same pattern as roomie-matches-view.
  const [places, setPlaces] = useState<PlaceDTO[] | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  async function fetchFavorites() {
    try {
      const { places: raw } = await api.get<{ places: PlaceRaw[] }>("/api/places/favorites");
      setFavoriteIds(new Set(raw.map((p) => p._id)));
    } catch {
      // favourites are non-critical — fail silently
    }
  }

  async function fetchPlaces() {
    if (showFavorites) {
      try {
        const { places: raw } = await api.get<{ places: PlaceRaw[] }>("/api/places/favorites");
        setPlaces(raw.map(toPlaceDTO));
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load favourites");
      }
      return;
    }
    if (!city.trim()) {
      setPlaces([]);
      return;
    }
    const params = new URLSearchParams({ city });
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    try {
      const { places: raw } = await api.get<{ places: PlaceRaw[] }>(`/api/places?${params.toString()}`);
      setPlaces(raw.map(toPlaceDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load places");
    }
  }

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    fetchPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, category, search, showFavorites]);

  const empty = showFavorites
    ? { title: "No favourites yet", description: "Save places you like to see them here." }
    : !city.trim()
      ? {
          title: "Set your destination city",
          description: "Add your destination city in Find a Roomie's profile tab and we'll show places to explore there.",
        }
      : { title: "No places found", description: "Try a different category or search." };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {!showFavorites && city.trim() && (
          <>
            <Select value={category || ANY} onValueChange={(v) => setCategory(v === ANY ? "" : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All categories</SelectItem>
                {PLACE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[160px]" />
          </>
        )}
        <Button
          variant={showFavorites ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFavorites((v) => !v)}
          className="ml-auto"
        >
          <Heart className="size-4" /> Favourites
        </Button>
      </div>

      {places === null ? null : places.length === 0 ? (
        <EmptyState
          icon={Compass}
          title={empty.title}
          description={empty.description}
          action={
            !showFavorites && !city.trim() ? (
              <Button asChild size="sm">
                <Link to="/find-a-roomie">Set destination city</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} isFavorite={favoriteIds.has(place.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
