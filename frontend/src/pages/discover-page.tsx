import { useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { api, peekCache } from "@/lib/api";
import { TravelProfileForm } from "@/features/discovery/travel-profile-form";
import { CoPackerView } from "@/features/discovery/co-packer-view";
import { RoommateView } from "@/features/discovery/roommate-view";
import { ConnectionsView } from "@/features/discovery/connections-view";
import { DirectoryContactsView } from "@/features/directory-contacts/directory-contacts-view";
import { toTravelProfileDTO, type TravelProfileRaw } from "@/features/discovery/discovery-dto";

const DISCOVERY_PROFILE_PATH = "/api/discovery/profile";

export default function DiscoverPage() {
  const cachedProfile = peekCache<{ profile: TravelProfileRaw | null }>(DISCOVERY_PROFILE_PATH);
  const [hasProfile, setHasProfile] = useState(() => Boolean(cachedProfile?.profile));
  const [defaultCity, setDefaultCity] = useState(() => toTravelProfileDTO(cachedProfile?.profile ?? null).destinationCity);
  const [loaded, setLoaded] = useState(() => cachedProfile !== undefined);

  useEffect(() => {
    api
      .get<{ profile: TravelProfileRaw | null }>(DISCOVERY_PROFILE_PATH)
      .then(({ profile }) => {
        const dto = toTravelProfileDTO(profile);
        setHasProfile(Boolean(profile));
        setDefaultCity(dto.destinationCity);
      })
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return (
    <div>
      <PageHeader title="Discover" description="Find co-packers, roommates, and useful contacts in your destination city" />

      <Tabs defaultValue="co-packer" className="flex flex-col gap-6">
        <TabsList className="flex-wrap overflow-x-auto">
          <TabsTrigger value="co-packer">Co-Packer</TabsTrigger>
          <TabsTrigger value="roommate">Roommate</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="co-packer">
          <CoPackerView hasProfile={hasProfile} />
        </TabsContent>
        <TabsContent value="roommate">
          <RoommateView hasProfile={hasProfile} />
        </TabsContent>
        <TabsContent value="contacts">
          <DirectoryContactsView defaultCity={defaultCity} />
        </TabsContent>
        <TabsContent value="requests">
          <ConnectionsView />
        </TabsContent>
        <TabsContent value="profile">
          <TravelProfileForm
            onSaved={(profile) => {
              setHasProfile(true);
              setDefaultCity(profile.destinationCity);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
