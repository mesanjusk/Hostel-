import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { DEFAULT_HOME_ELEMENTS } from "@/features/welcome/home-elements-default";
import { mergeHomeElements, mergeSectionBackgrounds } from "@/features/welcome/home-elements-merge";
import type { CanvasElement, ElementOverride, SectionBackgroundOverride } from "@/features/welcome/canvas-types";

interface LandingDesignResponse {
  elements: ElementOverride[] | null;
  sectionBackgrounds: SectionBackgroundOverride[] | null;
}

/** Fetches the admin-saved home screen design (element placement + section backgrounds),
 * falling back to the defaults until it loads or if nothing has been saved yet. Public
 * endpoint — the home screen is shown to signed-out visitors too. */
export function useHomeDesign(): { elements: CanvasElement[]; sectionBackgrounds: Record<string, string> } {
  const [elements, setElements] = useState<CanvasElement[]>(DEFAULT_HOME_ELEMENTS);
  const [sectionBackgrounds, setSectionBackgrounds] = useState<Record<string, string>>(() =>
    mergeSectionBackgrounds(null),
  );

  useEffect(() => {
    let cancelled = false;
    api
      .get<LandingDesignResponse>("/api/landing/design")
      .then((res) => {
        if (!cancelled) {
          setElements(mergeHomeElements(res.elements));
          setSectionBackgrounds(mergeSectionBackgrounds(res.sectionBackgrounds));
        }
      })
      .catch(() => {
        // Keep the defaults if the fetch fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { elements, sectionBackgrounds };
}
