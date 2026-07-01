"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import type { SearchResult } from "@/services/searchService";

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  checklist: "Checklist",
  budget: "Budget",
  note: "Notes",
  document: "Documents",
  contact: "Emergency Contacts",
  wishlist: "Wishlist",
};

export function SearchPageView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        // ignore aborted requests
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <div>
      <PageHeader title="Search" description="Find anything across your checklist, budget, notes, and more" />

      <div className="relative mb-6">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        <Input
          autoFocus
          className="h-12 pl-11 text-base"
          placeholder="Search checklist, budget, notes, documents, contacts, wishlist…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!query.trim() ? (
        <EmptyState icon={SearchIcon} title="Start typing to search" description="Try an item name, note title, or expense." />
      ) : !loading && results.length === 0 ? (
        <EmptyState icon={SearchIcon} title="No results" description={`Nothing matched "${query}"`} />
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((result) => (
            <Link key={`${result.type}-${result.id}`} href={result.href}>
              <Card className="flex-row items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-muted-foreground text-sm">{result.subtitle}</p>
                  )}
                </div>
                <Badge variant="outline">{TYPE_LABELS[result.type]}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
