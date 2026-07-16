import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { CategoryView } from "@/features/checklist/category-view";
import NotFound from "@/pages/not-found";
import {
  toChecklistItemDTO,
  type ChecklistItemDTO,
  type ChecklistItemRaw,
} from "@/features/checklist/checklist-item-dto";

export default function ChecklistCategoryPage() {
  const { category: rawCategory } = useParams<{ category: string }>();
  const category = decodeURIComponent(rawCategory ?? "");
  const [allCategories, setAllCategories] = useState<string[] | null>(null);
  const [items, setItems] = useState<ChecklistItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const [{ categories }, { categories: grouped }] = await Promise.all([
        api.get<{ categories: { id: string; name: string; icon: string | null }[] }>("/api/categories"),
        api.get<{ categories: { category: string; items: ChecklistItemRaw[] }[] }>("/api/checklist"),
      ]);
      setAllCategories(categories.map((c) => c.name));
      const group = grouped.find((g) => g.category === category);
      setItems(group ? group.items.map(toChecklistItemDTO) : []);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load category");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  if (loading) return null;
  if (!allCategories?.includes(category)) return <NotFound />;

  return <CategoryView category={category} initialItems={items} />;
}
