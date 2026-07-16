import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { DEFAULT_HUB_LAYOUT, mergeHubLayout, sortedHubLayout, type HubLayoutEntry } from "@/features/welcome/hub-widget-registry";
import type { WidgetConfig } from "@/features/dashboard/widget-registry";

/** Fetches the admin-configured home hub card visibility and order, falling back to the
 * default (everything visible, declared order) until it loads or if no layout has been saved
 * yet. Saved data is merged onto the current card set rather than used as-is, so a card added
 * after the layout was last saved doesn't silently disappear for having no saved entry.
 * Returned entries are sorted by `order`, ready to render as-is. */
export function useHubLayout(): HubLayoutEntry[] {
  const [layout, setLayout] = useState<HubLayoutEntry[]>(DEFAULT_HUB_LAYOUT);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ widgets: WidgetConfig[] | null }>("/api/home/layout")
      .then((res) => {
        if (!cancelled) setLayout(mergeHubLayout(res.widgets));
      })
      .catch(() => {
        // Keep the default layout if the fetch fails — never block the home page on this.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return sortedHubLayout(layout);
}
