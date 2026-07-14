import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { SuggestedItemsView } from "@/features/admin/suggested-items-view";
import type { SuggestedItemDTO } from "@/features/admin/suggested-item-dto";

export default function AdminSuggestedItemsPage() {
  const [suggestions, setSuggestions] = useState<SuggestedItemDTO[]>([]);

  async function fetchData() {
    try {
      const { suggestions: raw } = await api.get<{ suggestions: SuggestedItemDTO[] }>("/api/admin/suggested-items");
      setSuggestions(raw);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load suggested items");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <SuggestedItemsView suggestions={suggestions} />
    </div>
  );
}
