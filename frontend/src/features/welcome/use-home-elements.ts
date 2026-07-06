import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { DEFAULT_HOME_ELEMENTS } from "@/features/welcome/home-elements-default";
import { mergeHomeElements } from "@/features/welcome/home-elements-merge";
import type { CanvasElement, ElementOverride } from "@/features/welcome/canvas-types";

/** Fetches the admin-saved home screen design, falling back to the default arrangement
 * until it loads or if nothing has been saved yet. Public endpoint — the home screen is
 * shown to signed-out visitors too. */
export function useHomeElements(): CanvasElement[] {
  const [elements, setElements] = useState<CanvasElement[]>(DEFAULT_HOME_ELEMENTS);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ elements: ElementOverride[] | null }>("/api/landing/design")
      .then((res) => {
        if (!cancelled) {
          setElements(mergeHomeElements(res.elements));
        }
      })
      .catch(() => {
        // Keep the default arrangement if the fetch fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return elements;
}
