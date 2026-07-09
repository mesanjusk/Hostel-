import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { DEFAULT_HOME_ELEMENTS } from "@/features/welcome/home-elements-default";
import { mergeHomeElements, mergeSectionBackgrounds } from "@/features/welcome/home-elements-merge";
import type { CanvasElement, ElementOverride, SectionBackgroundOverride } from "@/features/welcome/canvas-types";

interface LandingDesignResponse {
  elements: ElementOverride[] | null;
  sectionBackgrounds: SectionBackgroundOverride[] | null;
}

/** Fetches the admin-saved home screen design (element placement + section backgrounds).
 * Public endpoint — the home screen is shown to signed-out visitors too.
 *
 * Deliberately does NOT paint the hardcoded defaults while the fetch is in flight: those
 * defaults (e.g. the hero section's "sunrise" gradient preset and its placeholder copy) are
 * almost always stale once an admin has customized the live design, so rendering them first
 * just to swap to the real saved design a moment later produces a visible flash of wrong
 * content on first load. Callers should treat the design as not-yet-ready while `loading`. */
export function useHomeDesign(): {
  elements: CanvasElement[];
  sectionBackgrounds: Record<string, string>;
  loading: boolean;
} {
  const [elements, setElements] = useState<CanvasElement[] | null>(null);
  const [sectionBackgrounds, setSectionBackgrounds] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<LandingDesignResponse>("/api/landing/design")
      .then((res) => {
        if (cancelled) return;
        setElements(mergeHomeElements(res.elements));
        setSectionBackgrounds(mergeSectionBackgrounds(res.sectionBackgrounds));
      })
      .catch(() => {
        // Only fall back to the defaults once we know the fetch itself failed.
        if (cancelled) return;
        setElements(DEFAULT_HOME_ELEMENTS);
        setSectionBackgrounds(mergeSectionBackgrounds(null));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    elements: elements ?? DEFAULT_HOME_ELEMENTS,
    sectionBackgrounds: sectionBackgrounds ?? mergeSectionBackgrounds(null),
    loading,
  };
}
