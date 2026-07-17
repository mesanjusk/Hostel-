import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { api, ApiError, peekCache } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { useAuth } from "@/context/auth-context";
import { ChecklistOverview } from "@/features/checklist/checklist-overview";
import { NotebookView } from "@/features/checklist/notebook-view";
import { ChecklistSkeleton } from "@/features/checklist/checklist-skeleton";
import {
  readPersistedChecklist,
  writePersistedChecklist,
  type PersistedChecklistPayload,
} from "@/features/checklist/checklist-cache";
import {
  toChecklistItemDTO,
  type ChecklistItemDTO,
  type ChecklistItemRaw,
} from "@/features/checklist/checklist-item-dto";

interface CategoryGroup {
  category: string;
  items: ChecklistItemDTO[];
}

const CHECKLIST_PATH = "/api/checklist";

function toGroups(categories: { category: string; items: ChecklistItemRaw[] }[]): CategoryGroup[] {
  return categories.map((g) => ({ category: g.category, items: g.items.map(toChecklistItemDTO) }));
}

/** The freshest checklist available synchronously at mount, without touching the network: the
 * in-memory GET cache first (warm within a session), then the localStorage copy from a previous
 * session. Lets the page paint real content on a cold reload / direct link / fresh login while
 * the background revalidation runs, instead of a blank screen. */
function readSeed(userId: string | undefined): PersistedChecklistPayload | null {
  return peekCache<PersistedChecklistPayload>(CHECKLIST_PATH) ?? readPersistedChecklist(userId);
}

export default function ChecklistPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [searchParams] = useSearchParams();

  const [groups, setGroups] = useState<CategoryGroup[]>(() => {
    const seed = readSeed(userId);
    return seed ? toGroups(seed.categories) : [];
  });
  // Only show the skeleton on a true cold load — with a seed we render it immediately and let the
  // fetch below quietly swap in any changes (stale-while-revalidate).
  const [loading, setLoading] = useState(() => readSeed(userId) === null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { categories } = await api.get<PersistedChecklistPayload>(CHECKLIST_PATH);
        setGroups(toGroups(categories));
        writePersistedChecklist(userId, { categories });
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load checklist");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return subscribeRefresh(fetchData);
  }, [userId]);

  if (loading) return <ChecklistSkeleton />;

  const overall = groups.reduce(
    (acc, g) => ({
      total: acc.total + g.items.length,
      completed: acc.completed + g.items.filter((i) => i.completed).length,
    }),
    { total: 0, completed: 0 },
  );
  const allCategories = groups.map((g) => g.category);
  const view = searchParams.get("view");
  const bulkEdit = searchParams.get("bulkEdit");

  if (view === "list" || bulkEdit === "1") {
    return <ChecklistOverview groups={groups} overall={overall} initialBulkEdit={bulkEdit === "1"} />;
  }

  return <NotebookView groups={groups} allCategories={allCategories} />;
}
