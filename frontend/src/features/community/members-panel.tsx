import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { listMembers, setMemberModeration, updateMemberRole } from "@/features/community/community-api";
import { ApiError } from "@/lib/api";
import type { CommunityRole, PublicUserDTO } from "@/types";

interface MemberRow {
  userId: PublicUserDTO;
  role: CommunityRole;
  muted: boolean;
  banned: boolean;
}

const ASSIGNABLE_ROLES: CommunityRole[] = ["admin", "moderator", "verified", "member"];

export function MembersPanel({ communityId, canModerate }: { communityId: string; canModerate: boolean }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMembers() {
    setLoading(true);
    try {
      const { members } = await listMembers(communityId);
      setMembers(members as MemberRow[]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  async function handleRoleChange(userId: string, role: CommunityRole) {
    try {
      await updateMemberRole(communityId, userId, role);
      fetchMembers();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update role");
    }
  }

  async function handleModeration(userId: string, patch: { muted?: boolean; banned?: boolean }) {
    try {
      await setMemberModeration(communityId, userId, patch);
      fetchMembers();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update member");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {members.map((m) => (
        <div key={m.userId.id} className="flex items-center gap-2.5 rounded-xl p-2">
          <Avatar className="size-8">
            <AvatarImage src={m.userId.avatar ?? undefined} />
            <AvatarFallback>{m.userId.displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{m.userId.displayName}</p>
            <p className="text-muted-foreground truncate text-xs">@{m.userId.username}</p>
          </div>
          <Badge variant={m.role === "owner" ? "accent" : "outline"} className="capitalize">
            {m.role}
          </Badge>
          {canModerate && m.role !== "owner" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ASSIGNABLE_ROLES.map((role) => (
                  <DropdownMenuItem key={role} onClick={() => handleRoleChange(m.userId.id, role)}>
                    Make {role}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => handleModeration(m.userId.id, { muted: !m.muted })}>
                  {m.muted ? "Unmute" : "Mute"}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => handleModeration(m.userId.id, { banned: !m.banned })}>
                  {m.banned ? "Unban" : "Ban"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );
}
