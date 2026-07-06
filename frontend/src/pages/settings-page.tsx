import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { SettingsView } from "@/features/settings/settings-view";

export default function SettingsPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ categories: { id: string; name: string; icon: string | null }[] }>("/api/categories")
      .then(({ categories }) => setCategories(categories.map((c) => c.name)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return <SettingsView categories={categories} />;
}
