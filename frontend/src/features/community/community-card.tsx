import { Users, Check } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api";
import type { CommunityDTO } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  country: "Country",
  city: "City",
  college: "College",
  campus: "Campus",
  course: "Course",
  year: "Year",
  hostel: "Hostel",
  interest: "Interest",
  marketplace: "Marketplace",
  events: "Events",
  lost_found: "Lost & Found",
  general: "General",
  announcements: "Announcements",
  custom: "Community",
};

export function CommunityCard({ community, onJoinToggle }: { community: CommunityDTO; onJoinToggle?: (community: CommunityDTO, joined: boolean) => void }) {
  async function handleJoin(join: boolean) {
    try {
      onJoinToggle?.(community, join);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="gradient-brand flex size-11 shrink-0 items-center justify-center rounded-2xl text-lg text-white">
          {community.icon || community.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/community/${community.slug}`} className="truncate font-display font-semibold hover:underline">
            {community.name}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{TYPE_LABELS[community.type] ?? community.type}</Badge>
            {community.isOfficial && <Badge variant="accent">Official</Badge>}
          </div>
        </div>
      </div>

      {community.description && <p className="text-muted-foreground line-clamp-2 text-sm">{community.description}</p>}

      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Users className="size-3.5" /> {community.memberCount} members
        </span>
        {community.joined ? (
          <Button size="sm" variant="outline" onClick={() => handleJoin(false)}>
            <Check className="size-3.5" /> Joined
          </Button>
        ) : (
          <Button size="sm" onClick={() => handleJoin(true)}>
            Join
          </Button>
        )}
      </div>
    </Card>
  );
}
