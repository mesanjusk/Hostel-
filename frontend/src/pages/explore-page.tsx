import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/context/auth-context";
import { PlacesView } from "@/features/places/places-view";

/** City comes straight from the account profile (`User.city`, set on the Profile page) — the
 * travel profile's own destinationCity is always a mirror of it, so there's no need to fetch
 * or wait on that separately here. */
export default function ExplorePage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Explore" description="Places to explore in your destination city" />
      <PlacesView city={user?.city ?? ""} />
    </div>
  );
}
