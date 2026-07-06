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

export interface SearchResult {
  type: "checklist" | "budget" | "note" | "document" | "contact" | "wishlist";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  checklist: "Checklist",
  budget: "Budget",
  note: "Notes",
  document: "Documents",
  contact: "Emergency Contacts",
  wishlist: "Wishlist",
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

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
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const data = await api.get<{ results: SearchResult[] }>(
          `/api/search?q=${encodeURIComponent(query)}`,
        );
        if (!cancelled) setResults(data.results ?? []);
      } catch {
        // ignore failed requests
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
        className="text-muted-foreground gap-2"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search everything…</span>
        <kbd className="bg-muted ml-2 hidden rounded px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search checklist, budget, notes, documents…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-none flex-1">
          <CommandEmpty>No results found.</CommandEmpty>
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
