import { DEFAULT_HOME_ELEMENTS } from "@/features/welcome/home-elements-default";
import type { CanvasElement, ElementOverride } from "@/features/welcome/canvas-types";

/** Merges admin-saved overrides onto the default seed. Elements with no override render
 * exactly as they do today; unknown ids in the override list (e.g. from a stale save) are
 * ignored rather than erroring. */
export function mergeHomeElements(overrides: ElementOverride[] | null | undefined): CanvasElement[] {
  if (!overrides || overrides.length === 0) return DEFAULT_HOME_ELEMENTS;

  const byId = new Map(overrides.map((o) => [o.id, o]));

  return DEFAULT_HOME_ELEMENTS.map((base) => {
    const o = byId.get(base.id);
    if (!o) return base;
    return {
      ...base,
      lines: o.lines ?? base.lines,
      ctaLabel: o.ctaLabel ?? base.ctaLabel,
      layouts: {
        mobile: { ...base.layouts.mobile, ...(o.layouts?.mobile ?? {}) },
        desktop: { ...base.layouts.desktop, ...(o.layouts?.desktop ?? {}) },
      },
    };
  });
}

/** Extracts only the fields that differ from default, to keep saved payloads small
 * and so future default tweaks aren't silently masked for untouched elements. */
export function diffHomeElements(edited: CanvasElement[]): ElementOverride[] {
  const baseById = new Map(DEFAULT_HOME_ELEMENTS.map((e) => [e.id, e]));
  const overrides: ElementOverride[] = [];

  for (const e of edited) {
    const base = baseById.get(e.id);
    if (!base) continue;

    const override: ElementOverride = { id: e.id };
    let changed = false;

    if (JSON.stringify(e.lines) !== JSON.stringify(base.lines)) {
      override.lines = e.lines;
      changed = true;
    }
    if (e.ctaLabel !== base.ctaLabel) {
      override.ctaLabel = e.ctaLabel;
      changed = true;
    }

    const layoutDiff: ElementOverride["layouts"] = {};
    (["mobile", "desktop"] as const).forEach((bp) => {
      const a = e.layouts[bp];
      const b = base.layouts[bp];
      if (a.x !== b.x || a.y !== b.y || a.scale !== b.scale || a.rotation !== b.rotation || a.visible !== b.visible) {
        layoutDiff[bp] = a;
        changed = true;
      }
    });
    if (layoutDiff.mobile || layoutDiff.desktop) {
      override.layouts = layoutDiff;
    }

    if (changed) overrides.push(override);
  }

  return overrides;
}
