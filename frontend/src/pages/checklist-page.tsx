import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { ChecklistOverview } from "@/features/checklist/checklist-overview";
import { NotebookView } from "@/features/checklist/notebook-view";
import {
  toChecklistItemDTO,
  type ChecklistItemDTO,
  type ChecklistItemRaw,
} from "@/features/checklist/checklist-item-dto";

interface CategoryGroup {
  category: string;
  items: ChecklistItemDTO[];
}

export default function ChecklistPage() {
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const { categories } = await api.get<{
        categories: { category: string; items: ChecklistItemRaw[] }[];
      }>("/api/checklist");
      setGroups(
        categories.map((g) => ({
          category: g.category,
          items: g.items.map(toChecklistItemDTO),
        })),
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load checklist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  if (loading) return null;

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

  return <NotebookView groups={groups} overall={overall} allCategories={allCategories} />;
}
