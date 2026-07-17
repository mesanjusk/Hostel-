import { useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { api, peekCache } from "@/lib/api";
import { TravelProfileForm } from "@/features/discovery/travel-profile-form";
import { RoommateView } from "@/features/discovery/roommate-view";
import { ConnectionsView } from "@/features/discovery/connections-view";
import {
  isRoommateProfileComplete,
  toTravelProfileDTO,
  type TravelProfileDTO,
  type TravelProfileRaw,
} from "@/features/discovery/discovery-dto";

const DISCOVERY_PROFILE_PATH = "/api/discovery/profile";

/** toTravelProfileDTO fills blanks for a missing profile, which would read as "has a profile,
 * just an empty one" — keep the null so the two states stay distinguishable. */
const readProfile = (raw: TravelProfileRaw | null | undefined): TravelProfileDTO | null =>
  raw ? toTravelProfileDTO(raw) : null;

export default function FindARoomiePage() {
  const cachedProfile = peekCache<{ profile: TravelProfileRaw | null }>(DISCOVERY_PROFILE_PATH);
  const [profile, setProfile] = useState<TravelProfileDTO | null>(() => readProfile(cachedProfile?.profile));
  const [loaded, setLoaded] = useState(() => cachedProfile !== undefined);
  const [tab, setTab] = useState("matches");

  useEffect(() => {
    api
      .get<{ profile: TravelProfileRaw | null }>(DISCOVERY_PROFILE_PATH)
      .then(({ profile }) => setProfile(readProfile(profile)))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return (
    <div>
      <PageHeader
        title="Find a Roomie"
        description="Match with students moving to your destination city, then start chatting"
      />

      <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-6">
        <TabsList className="flex-wrap overflow-x-auto">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          <RoommateView
            hasProfile={profile != null}
            profileComplete={isRoommateProfileComplete(profile)}
            onEditProfile={() => setTab("profile")}
          />
        </TabsContent>
        <TabsContent value="requests">
          <ConnectionsView context="roommate" />
        </TabsContent>
        <TabsContent value="profile">
          <TravelProfileForm
            onSaved={(saved) => {
              setProfile(saved);
              // Saving from the empty state is only ever a means to an end — drop them back on
              // the matches they came here for rather than leaving them staring at the form.
              setTab("matches");
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
