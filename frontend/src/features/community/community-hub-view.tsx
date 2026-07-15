import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Users2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunityCard } from "@/features/community/community-card";
import { CreateCommunityDialog } from "@/features/community/create-community-dialog";
import { discoverCommunities, joinCommunity, leaveCommunity, listMyCommunities } from "@/features/community/community-api";
import { ApiError } from "@/lib/api";
import type { CommunityDTO } from "@/types";

export function CommunityHubView() {
  const [mine, setMine] = useState<CommunityDTO[]>([]);
  const [discover, setDiscover] = useState<CommunityDTO[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [query, setQuery] = useState("");

  async function fetchMine() {
    setLoadingMine(true);
    try {
      const { communities } = await listMyCommunities();
      setMine(communities);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load your communities");
    } finally {
      setLoadingMine(false);
    }
  }

  async function fetchDiscover(q?: string) {
    setLoadingDiscover(true);
    try {
      const { communities } = await discoverCommunities({ q });
      setDiscover(communities);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load communities");
    } finally {
      setLoadingDiscover(false);
    }
  }

  useEffect(() => {
    fetchMine();
    fetchDiscover();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => fetchDiscover(query || undefined), 300);
    return () => clearTimeout(handle);
  }, [query]);

  async function handleToggleJoin(community: CommunityDTO, join: boolean) {
    const update = (list: CommunityDTO[]) =>
      list.map((c) => (c._id === community._id ? { ...c, joined: join, memberCount: c.memberCount + (join ? 1 : -1) } : c));
    setDiscover(update);
    try {
      if (join) {
        await joinCommunity(community._id);
        fetchMine();
      } else {
        await leaveCommunity(community._id);
        setMine((prev) => prev.filter((c) => c._id !== community._id));
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update membership");
      fetchDiscover(query || undefined);
    }
  }

  return (
    <div>
      <PageHeader
        title="Community"
        description="Connect with students from your college, course, city, and interests"
        action={<CreateCommunityDialog />}
      />

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My Communities</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          {loadingMine ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : mine.length === 0 ? (
            <EmptyState icon={Users2} title="No communities yet" description="Complete your profile to auto-join your college and city communities." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((c) => (
                <CommunityCard key={c._id} community={{ ...c, joined: true }} onJoinToggle={handleToggleJoin} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="mt-4">
          <div className="relative mb-4">
            <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input placeholder="Search communities..." className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {loadingDiscover ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : discover.length === 0 ? (
            <EmptyState icon={Search} title="No communities found" description="Try a different search, or create your own." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {discover.map((c) => (
                <CommunityCard key={c._id} community={c} onJoinToggle={handleToggleJoin} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
