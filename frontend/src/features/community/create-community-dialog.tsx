import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createCommunity } from "@/features/community/community-api";
import { ApiError } from "@/lib/api";

export function CreateCommunityDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (name.trim().length < 3) {
      toast.error("Name must be at least 3 characters");
      return;
    }
    setSubmitting(true);
    try {
      const { community } = await createCommunity({ name: name.trim(), description: description.trim(), allowAnonymous });
      toast.success("Community created");
      setOpen(false);
      navigate(`/community/${community.slug}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create community");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> New community
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a community</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="community-name">Name</Label>
            <Input id="community-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Photography Club" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="community-desc">Description</Label>
            <Textarea id="community-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this community about?" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={allowAnonymous} onCheckedChange={setAllowAnonymous} />
            Allow anonymous posting
          </label>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
