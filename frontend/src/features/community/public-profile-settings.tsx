import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { updatePublicProfile, updateUsername } from "@/features/community/community-api";
import { AvatarUploadField } from "@/features/auth/avatar-upload-field";

const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

/** Community/chat's public identity is a photo and a username — never the real name, mobile,
 * or city/college (those live in the account profile form above). The username doubles as the
 * display name (see backend User model), so there's no separate display-name field to edit. */
export function PublicProfileSettings({ autoOpen = false }: { autoOpen?: boolean }) {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setUsername(user.username ?? "");
    setAvatar(user.avatar ?? "");
  }, [open, user]);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  async function handleSave() {
    const normalized = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized)) {
      toast.error("3-32 characters: letters, numbers, underscore only");
      return;
    }
    setSaving(true);
    try {
      if (normalized !== user?.username) {
        await updateUsername(normalized);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update username");
      setSaving(false);
      return;
    }
    try {
      await updatePublicProfile({ avatar: avatar || null });
      await refreshUser();
      toast.success("Community profile updated");
      setOpen(false);
    } catch (error) {
      // The username change above may already have been committed server-side even though
      // this step failed — refresh so the UI doesn't keep showing the stale pre-save value.
      await refreshUser();
      toast.error(error instanceof ApiError ? error.message : "Username saved, but the photo failed to update");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const initials = (user.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community profile</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-14">
            {user.avatar && <AvatarImage src={user.avatar} alt={user.username ?? "Community profile"} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">@{user.username}</p>
            <p className="text-muted-foreground text-xs">Shown to other students in Community and Chat</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <Pencil className="size-4" /> Edit
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit community profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <AvatarUploadField value={avatar} onChange={setAvatar} fallback={initials} />
            <div className="flex w-full flex-col gap-1.5">
              <Label htmlFor="username-input">Username</Label>
              <div className="relative">
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                  @
                </span>
                <Input
                  id="username-input"
                  className="pl-7"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={32}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
