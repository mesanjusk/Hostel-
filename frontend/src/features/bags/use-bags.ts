import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";

/** Shared "what bags does this user have" fetch for anywhere that needs the list inline
 * (e.g. a checklist item's "Add to Bag" submenu) — relies on api.ts's GET dedupe/cache so
 * multiple call sites mounting at once don't each fire their own request. */
export function useBags() {
  const [bags, setBags] = useState<BagSummaryDTO[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBags() {
      try {
        const { bags } = await api.get<{ bags: BagSummaryDTO[] }>("/api/bags");
        if (!cancelled) setBags(bags);
      } catch {
        if (!cancelled) setBags([]);
      }
    }

    fetchBags();
    const unsubscribe = subscribeRefresh(fetchBags);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return bags;
}
