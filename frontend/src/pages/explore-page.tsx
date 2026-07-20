import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/context/auth-context";
import { PlacesView } from "@/features/places/places-view";
import { CityQuickPrompt } from "@/features/auth/quick-profile-prompts";

/** City comes straight from the account profile (`User.city`) — the travel profile's own
 * destinationCity is always a mirror of it, so there's no need to fetch or wait on that
 * separately here. Missing it no longer sends the visitor off to a full profile-edit form: an
 * anonymous (or just not-yet-filled-in) visitor is prompted for just this one field in place
 * (see quick-profile-prompts.tsx), which is exactly the point of progressive profiling — Explore
 * is the first place this account's city is ever actually needed. */
export default function ExplorePage() {
  const { user } = useAuth();

  const city = user?.city ?? "";

  return (
    <div>
      <PageHeader
        title="Explore"
        description={city ? `Places to explore in ${city}` : "Places to explore in your destination city"}
      />
      {city ? <PlacesView city={city} /> : <CityQuickPrompt />}
    </div>
  );
}
