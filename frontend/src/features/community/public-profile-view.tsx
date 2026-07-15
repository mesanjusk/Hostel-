import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BadgeCheck, MessageSquare, MoreVertical, ShieldOff } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportDialog } from "@/features/community/report-dialog";
import { getPublicProfile, startDirectConversation, blockUser } from "@/features/community/community-api";
import { ApiError } from "@/lib/api";
import type { PublicUserDTO } from "@/types";

export function PublicProfileView() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getPublicProfile(username)
      .then(({ profile }) => setProfile(profile))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "User not found"))
      .finally(() => setLoading(false));
  }, [username]);

  async function handleMessage() {
    if (!profile) return;
    try {
      const { conversation } = await startDirectConversation(profile.id);
      navigate(`/chat/${conversation._id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to start conversation");
    }
  }

  async function handleBlock() {
    if (!profile) return;
    try {
      await blockUser(profile.id);
      toast.success(`Blocked @${profile.username}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to block user");
    }
  }

  if (loading) {
    return <Skeleton className="h-64" />;
  }

  if (!profile) {
    return <p className="text-muted-foreground">This student couldn't be found.</p>;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 pt-6 text-center">
      <Avatar className="size-24">
        <AvatarImage src={profile.avatar ?? undefined} />
        <AvatarFallback className="text-2xl">{profile.displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <div className="flex items-center justify-center gap-1.5">
          <h1 className="font-display text-xl font-bold">{profile.displayName}</h1>
          {profile.verified && <BadgeCheck className="text-primary size-5" />}
        </div>
        <p className="text-muted-foreground">@{profile.username}</p>
      </div>

      {profile.bio && <p className="text-sm">{profile.bio}</p>}

      <div className="flex flex-wrap justify-center gap-1.5">
        {profile.college && <Badge variant="outline">{profile.college}</Badge>}
        {profile.campus && <Badge variant="outline">{profile.campus}</Badge>}
        {profile.city && <Badge variant="outline">{profile.city}</Badge>}
      </div>

      {profile.interests.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {profile.interests.map((interest) => (
            <Badge key={interest} variant="secondary">
              {interest}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={handleMessage}>
          <MessageSquare className="size-4" /> Message
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More options">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ReportDialog
              targetType="user"
              targetId={profile.id}
              trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Report</DropdownMenuItem>}
            />
            <DropdownMenuItem variant="destructive" onClick={handleBlock}>
              <ShieldOff className="size-3.5" /> Block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
