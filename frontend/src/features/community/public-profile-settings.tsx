import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { updatePublicProfile, updateUsername } from "@/features/community/community-api";

/** Everything here maps to community/chat's public identity — the only fields visible to
 * other students (see PublicUserDTO). Real name, mobile, city/college stay in the profile
 * form above and are never sent to these endpoints. */
export function PublicProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [interests, setInterests] = useState((user?.interests ?? []).join(", "));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (username && username !== user?.username) {
        await updateUsername(username);
      }
      await updatePublicProfile({
        displayName,
        bio,
        interests: interests.split(",").map((i) => i.trim()).filter(Boolean).slice(0, 20),
      });
      await refreshUser();
      toast.success("Public profile updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update public profile");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          This is what other students see in Community and Chat — never your real name, mobile, or college room.
          {user.username && (
            <>
              {" "}
              <Link to={`/u/${user.username}`} className="text-primary underline">
                View your public profile
              </Link>
            </>
          )}
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="hostelhawk" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="display-name">Display name</Label>
          <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How you'd like to appear" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="Tell other students a bit about you" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="interests">Interests (comma separated)</Label>
          <Input id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Photography, Gaming, Music" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="self-start">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save community profile
        </Button>
      </CardContent>
    </Card>
  );
}
