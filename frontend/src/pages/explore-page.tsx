import { useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { api, peekCache } from "@/lib/api";
import { PlacesView } from "@/features/places/places-view";
import { toTravelProfileDTO, type TravelProfileRaw } from "@/features/discovery/discovery-dto";

const DISCOVERY_PROFILE_PATH = "/api/discovery/profile";

export default function ExplorePage() {
  const cachedProfile = peekCache<{ profile: TravelProfileRaw | null }>(DISCOVERY_PROFILE_PATH);
  const [defaultCity, setDefaultCity] = useState(() => toTravelProfileDTO(cachedProfile?.profile ?? null).destinationCity);
  const [loaded, setLoaded] = useState(() => cachedProfile !== undefined);

  useEffect(() => {
    api
      .get<{ profile: TravelProfileRaw | null }>(DISCOVERY_PROFILE_PATH)
      .then(({ profile }) => setDefaultCity(toTravelProfileDTO(profile).destinationCity))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return (
    <div>
      <PageHeader title="Explore" description="Places to explore in your destination city" />
      <PlacesView defaultCity={defaultCity} />
    </div>
  );
}
