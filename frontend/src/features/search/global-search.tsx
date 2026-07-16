import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { api } from "@/lib/api";
import { GUIDE_TOPICS } from "@/features/guide/guide-topics";

export interface SearchResult {
  type: "checklist" | "bag" | "budget" | "note" | "document" | "contact" | "wishlist" | "guide";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string | null;
  completed?: boolean;
}

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  checklist: "Checklist",
  bag: "Bags",
  budget: "Budget",
  note: "Notes",
  document: "Documents",
  contact: "Emergency Contacts",
  wishlist: "Wishlist",
  guide: "Hostel Guide",
};

/** The Hostel Survival Guide's content is a static scrapbook page, not database records, so
 * it isn't covered by the server search — match its topics client-side instead. */
function matchingGuideTopics(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return GUIDE_TOPICS.filter(
    (topic) => topic.label.toLowerCase().includes(q) || topic.keywords.toLowerCase().includes(q),
  ).map((topic) => ({
    type: "guide" as const,
    id: topic.id,
    title: topic.label,
    href: `/guide/survival-guide#${topic.id}`,
  }));
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await api.get<{ results: SearchResult[] }>(
          `/api/search?q=${encodeURIComponent(query)}`,
        );
        if (!cancelled) setResults([...matchingGuideTopics(query), ...(data.results ?? [])]);
      } catch {
        // ignore failed requests
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    acc[r.type] = acc[r.type] ? [...acc[r.type], r] : [r];
    return acc;
  }, {});

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground w-full justify-start gap-2 lg:h-11"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search everything…</span>
        <kbd className="bg-muted ml-auto hidden rounded px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search checklist, budget, notes, documents, guide…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-none flex-1">
          {query.trim() && !loading && <CommandEmpty>No results found.</CommandEmpty>}
          {Object.entries(grouped).map(([type, items]) => (
            <CommandGroup key={type} heading={TYPE_LABELS[type as SearchResult["type"]]}>
              {items.map((item) => (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    navigate(item.href);
                  }}
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-6 rounded object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    {item.subtitle && (
                      <span className="text-muted-foreground text-xs">{item.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
