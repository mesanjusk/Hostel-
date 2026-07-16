import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Hash, Megaphone, Plus, Users2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatWindow } from "@/features/community/chat-window";
import { MembersPanel } from "@/features/community/members-panel";
import { getCommunity, createChannel, leaveCommunity } from "@/features/community/community-api";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import type { ChannelDTO, CommunityDTO, CommunityRole } from "@/types";

function NewChannelDialog({ communityId, onCreated }: { communityId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (name.trim().length < 2) return;
    setSubmitting(true);
    try {
      await createChannel(communityId, { name: name.trim() });
      setOpen(false);
      setName("");
      onCreated();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create channel");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" aria-label="New channel">
          <Plus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
        </DialogHeader>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. study-group" />
        <DialogFooter>
          <Button onClick={handleCreate} disabled={submitting}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CommunityDetailView() {
  const { user } = useAuth();
  const isSiteAdmin = user?.role === "admin";
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<CommunityDTO | null>(null);
  const [myRole, setMyRole] = useState<CommunityRole | null>(null);
  const [channels, setChannels] = useState<ChannelDTO[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  async function fetchCommunity() {
    if (!slug) return;
    setLoading(true);
    try {
      const data = await getCommunity(slug);
      setCommunity(data.community);
      setMyRole(data.myRole as CommunityRole | null);
      setChannels(data.channels);
      setActiveChannelId((prev) => prev ?? data.channels.find((c) => c.slug === "general")?._id ?? data.channels[0]?._id ?? null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load community");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleLeave() {
    if (!community) return;
    setLeaving(true);
    try {
      await leaveCommunity(community._id);
      toast.success(`Left ${community.name}`);
      navigate("/community");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to leave community");
    } finally {
      setLeaving(false);
    }
  }

  // Site admins get full moderation power on every community, not just the ones they've
  // joined or created — mirrors the backend's isSiteAdmin bypass on the member routes.
  const canModerate = isSiteAdmin || Boolean(myRole && ["owner", "admin", "moderator"].includes(myRole));
  const activeChannel = channels.find((c) => c._id === activeChannelId) ?? null;

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!community) {
    return <p className="text-muted-foreground">Community not found.</p>;
  }

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col gap-3 lg:h-[calc(100dvh-6rem)]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display truncate text-xl font-bold">{community.name}</h1>
          <p className="text-muted-foreground truncate text-xs">{community.memberCount} members</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Users2 className="size-4" /> Members
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Members</SheetTitle>
            </SheetHeader>
            <MembersPanel
              communityId={community._id}
              canModerate={canModerate}
              isSiteAdmin={isSiteAdmin}
              onLeave={myRole ? handleLeave : undefined}
              leaving={leaving}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {channels.map((channel) => (
          <button
            key={channel._id}
            onClick={() => setActiveChannelId(channel._id)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap",
              channel._id === activeChannelId ? "bg-primary text-primary-foreground border-primary" : "border-border/70 text-muted-foreground",
            )}
          >
            {channel.type === "announcement" ? <Megaphone className="size-3.5" /> : <Hash className="size-3.5" />}
            {channel.name}
          </button>
        ))}
        {canModerate && <NewChannelDialog communityId={community._id} onCreated={fetchCommunity} />}
      </div>

      {activeChannel && (
        <div className="min-h-0 flex-1 rounded-2xl border border-border/70">
          {activeChannel.topic && (
            <p className="text-muted-foreground border-b border-border/70 px-4 py-2 text-xs">{activeChannel.topic}</p>
          )}
          <div className="h-full min-h-0" style={{ height: activeChannel.topic ? "calc(100% - 2rem)" : "100%" }}>
            <ChatWindow
              key={activeChannel._id}
              scopeType="channel"
              scopeId={activeChannel._id}
              allowAnonymous={activeChannel.allowAnonymous || community.allowAnonymous}
              canModerate={canModerate}
            />
          </div>
        </div>
      )}

      {myRole ? (
        <Badge variant="secondary" className="w-fit capitalize">
          Your role: {myRole}
        </Badge>
      ) : (
        isSiteAdmin && (
          <Badge variant="accent" className="w-fit">
            Managing as site admin
          </Badge>
        )
      )}
    </div>
  );
}
