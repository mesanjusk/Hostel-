import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, peekCache } from "@/lib/api";
import { SettingsView } from "@/features/settings/settings-view";

const CATEGORIES_PATH = "/api/categories";

export default function SettingsPage() {
  const cachedCategories = peekCache<{ categories: { id: string; name: string; icon: string | null }[] }>(CATEGORIES_PATH);
  const [categories, setCategories] = useState<string[]>(() => cachedCategories?.categories.map((c) => c.name) ?? []);
  const [loading, setLoading] = useState(() => !cachedCategories);

  useEffect(() => {
    api
      .get<{ categories: { id: string; name: string; icon: string | null }[] }>(CATEGORIES_PATH)
      .then(({ categories }) => setCategories(categories.map((c) => c.name)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return <SettingsView categories={categories} />;
}
