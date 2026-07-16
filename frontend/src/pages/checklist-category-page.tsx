import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { api, ApiError, peekCache } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { CategoryView } from "@/features/checklist/category-view";
import NotFound from "@/pages/not-found";
import {
  toChecklistItemDTO,
  type ChecklistItemDTO,
  type ChecklistItemRaw,
} from "@/features/checklist/checklist-item-dto";

const CATEGORIES_PATH = "/api/categories";
const CHECKLIST_PATH = "/api/checklist";

function peekCategoryData(category: string) {
  const categoriesResp = peekCache<{ categories: { id: string; name: string; icon: string | null }[] }>(CATEGORIES_PATH);
  const checklistResp = peekCache<{ categories: { category: string; items: ChecklistItemRaw[] }[] }>(CHECKLIST_PATH);
  if (!categoriesResp || !checklistResp) return null;
  const group = checklistResp.categories.find((g) => g.category === category);
  return {
    allCategories: categoriesResp.categories.map((c) => c.name),
    items: group ? group.items.map(toChecklistItemDTO) : [],
  };
}

export default function ChecklistCategoryPage() {
  const { category: rawCategory } = useParams<{ category: string }>();
  const category = decodeURIComponent(rawCategory ?? "");
  const cached = peekCategoryData(category);
  const [allCategories, setAllCategories] = useState<string[] | null>(() => cached?.allCategories ?? null);
  const [items, setItems] = useState<ChecklistItemDTO[]>(() => cached?.items ?? []);
  const [loading, setLoading] = useState(() => !cached);

  async function fetchData() {
    try {
      const [{ categories }, { categories: grouped }] = await Promise.all([
        api.get<{ categories: { id: string; name: string; icon: string | null }[] }>(CATEGORIES_PATH),
        api.get<{ categories: { category: string; items: ChecklistItemRaw[] }[] }>(CHECKLIST_PATH),
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
    const alreadyCached = peekCategoryData(category);
    setLoading(!alreadyCached);
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  if (loading) return null;
  if (!allCategories?.includes(category)) return <NotFound />;

  return <CategoryView category={category} initialItems={items} />;
}
