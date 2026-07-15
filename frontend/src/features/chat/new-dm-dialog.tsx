import { useState } from "react";
import { toast } from "sonner";
import { MessageSquarePlus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api, ApiError } from "@/lib/api";
import { startDirectConversation } from "@/features/community/community-api";

interface UserSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
}

export function NewDmDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { results: all } = await api.get<{ results: Array<{ type: string; id: string; title: string; subtitle?: string; imageUrl?: string | null }> }>(
        `/api/search?q=${encodeURIComponent(value)}`,
      );
      setResults(all.filter((r) => r.type === "user"));
    } catch {
      // Silent — search-as-you-type shouldn't toast on every keystroke failure.
    } finally {
      setSearching(false);
    }
  }

  async function handleStart(userId: string) {
    try {
      const { conversation } = await startDirectConversation(userId);
      setOpen(false);
      navigate(`/chat/${conversation._id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to start conversation");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <MessageSquarePlus className="size-4" /> New message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input placeholder="Search by @username" className="pl-10" value={query} onChange={(e) => handleSearch(e.target.value)} />
        </div>
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {searching && <p className="text-muted-foreground text-sm">Searching…</p>}
          {!searching && query.length >= 2 && results.length === 0 && (
            <p className="text-muted-foreground text-sm">No students found with that username.</p>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => handleStart(r.id)}
              className="flex items-center gap-2.5 rounded-xl p-2 text-left hover:bg-muted"
            >
              <Avatar className="size-8">
                <AvatarImage src={r.imageUrl ?? undefined} />
                <AvatarFallback>{r.title.replace("@", "").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                {r.subtitle && <p className="text-muted-foreground text-xs">{r.subtitle}</p>}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
