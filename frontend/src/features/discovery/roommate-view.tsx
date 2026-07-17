import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { DiscoveryCard } from "@/features/discovery/discovery-card";
import { DiscoveryFilters, EMPTY_FILTERS, buildDiscoveryQuery, type DiscoveryFilterState } from "@/features/discovery/discovery-filters";
import type { DiscoveryCardDTO } from "@/features/discovery/discovery-dto";

/** @param profileComplete - Whether the profile carries the fields roommate matching requires
 * (budget, accommodation type — see isRoommateProfileComplete). The server returns nothing
 * without them, so without this the student would get a "no roomies" screen blaming the city
 * for a gap in their own profile.
 * @param onEditProfile - Sends the student to the travel-profile form. Matching is impossible
 * without one, so this is the only way out of the empty state — the form lives in a sibling
 * tab, not on screen. */
export function RoommateView({
  hasProfile,
  profileComplete,
  onEditProfile,
}: {
  hasProfile: boolean;
  profileComplete: boolean;
  onEditProfile?: () => void;
}) {
  const [filters, setFilters] = useState<DiscoveryFilterState>(EMPTY_FILTERS);
  const [results, setResults] = useState<DiscoveryCardDTO[] | null>(null);

  useEffect(() => {
    if (!hasProfile || !profileComplete) {
      setResults([]);
      return;
    }
    api
      .get<{ results: DiscoveryCardDTO[] }>(`/api/discovery/roommates?${buildDiscoveryQuery(filters)}`)
      .then(({ results }) => setResults(results))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load roommates"));
  }, [filters, hasProfile, profileComplete]);

  if (!hasProfile) {
    return (
      <EmptyState
        icon={Home}
        title="Save your travel profile first"
        description="Tell us where you're headed, your budget and the kind of place you want, and we'll match you with roomies looking for the same."
        action={
          onEditProfile && (
            <Button size="sm" onClick={onEditProfile}>
              Set up my profile
            </Button>
          )
        }
      />
    );
  }

  if (!profileComplete) {
    return (
      <EmptyState
        icon={Home}
        title="Finish your profile to see roomies"
        description="Matching needs your budget and the kind of place you're after — we only suggest people who overlap with both, so add them and your roomies will show up here."
        action={
          onEditProfile && (
            <Button size="sm" onClick={onEditProfile}>
              Complete my profile
            </Button>
          )
        }
      />
    );
  }

  return (
    <div>
      <DiscoveryFilters value={filters} onChange={setFilters} showRoommateFilters />
      {results === null ? null : results.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No roommates found yet"
          description="No one in your destination city matches your budget, accommodation type and gender preference yet — widening your budget helps, or check back later."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((card) => (
            <DiscoveryCard key={card.userId} card={card} context="roommate" />
          ))}
        </div>
      )}
    </div>
  );
}
