import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { LISTING_TYPES } from "@/types";
import { ListingCard } from "@/features/listings/listing-card";
import { ListingFormDialog } from "@/features/listings/listing-form-dialog";
import { toListingDTO, type ListingDTO, type ListingRaw } from "@/features/listings/listing-dto";

const ANY = "__any__";

export function ListingsView({ defaultCity }: { defaultCity: string }) {
  const [city, setCity] = useState(defaultCity);
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  // null (not []) until the first fetch resolves, so the page doesn't flash "No listings found"
  // before the real data arrives — same pattern as places-view.
  const [listings, setListings] = useState<ListingDTO[] | null>(null);

  useEffect(() => {
    setCity(defaultCity);
  }, [defaultCity]);

  useEffect(() => {
    if (!city.trim()) {
      setListings([]);
      return;
    }
    const params = new URLSearchParams({ city });
    if (type) params.set("type", type);
    if (search) params.set("search", search);
    function fetchListings() {
      api
        .get<{ listings: ListingRaw[] }>(`/api/listings?${params.toString()}`)
        .then(({ listings: raw }) => setListings(raw.map(toListingDTO)))
        .catch((error) => {
          toast.error(error instanceof ApiError ? error.message : "Failed to load listings");
        });
    }
    fetchListings();
    // Refetches after a user submits a new listing via ListingFormDialog below (emitRefresh),
    // so it shows up without the filters themselves having to change.
    return subscribeRefresh(fetchListings);
  }, [city, type, search]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="City…" value={city} onChange={(e) => setCity(e.target.value)} className="max-w-[160px]" />
          <Select value={type || ANY} onValueChange={(v) => setType(v === ANY ? "" : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All types</SelectItem>
              {LISTING_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[160px]" />
        </div>
        <ListingFormDialog defaultCity={city} />
      </div>

      {listings === null ? null : listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={!city.trim() ? "Enter a city" : "No listings found"}
          description={
            !city.trim()
              ? "Type a city to see available hostels, PGs, and flats there."
              : "Try a different city, type, or search."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
