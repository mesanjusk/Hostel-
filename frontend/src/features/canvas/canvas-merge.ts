import type { CanvasElement, ElementOverride, SectionBackgroundOverride } from "@/features/welcome/canvas-types";

const DEFAULT_CUSTOM_LAYOUT = { x: 50, y: 50, scale: 1, rotation: 0, visible: true, zIndex: 0 };

/** The bundled sticker PNGs were converted to WebP — rewrite any bundled-sticker path an
 * older admin-saved design may still carry in Mongo, for every canvas page (home, guide).
 * Uploaded custom stickers (data: URLs) and external URLs pass through untouched. */
function normalizeStickerSrc(src: string | undefined): string | undefined {
  return src?.replace(/^\/stickers\/([^/]+)\.png$/, "/stickers/$1.webp");
}

/** Builds a full CanvasElement from an admin-added custom element's override — there's no
 * default to merge onto, so the override must already carry everything needed. */
function customElementFromOverride(o: ElementOverride): CanvasElement | null {
  if (!o.kind) return null;
  return {
    id: o.id,
    section: o.section ?? 0,
    kind: o.kind,
    src: normalizeStickerSrc(o.src),
    alt: o.alt,
    emoji: o.emoji,
    lines: o.lines,
    ctaLabel: o.ctaLabel,
    href: o.href,
    background: o.background,
    shape: o.shape,
    textStyle: o.textStyle,
    textColor: o.textColor,
    fontSize: o.fontSize,
    bold: o.bold,
    isCustom: true,
    layouts: {
      mobile: { ...DEFAULT_CUSTOM_LAYOUT, ...(o.layouts?.mobile ?? {}) },
      desktop: { ...DEFAULT_CUSTOM_LAYOUT, ...(o.layouts?.desktop ?? {}) },
    },
  };
}

/** Merges admin-saved overrides onto a page's default seed, and appends any admin-added
 * custom elements (uploaded stickers, blank cards) that aren't part of the built-in defaults
 * at all. Unrecognized/malformed custom entries are skipped rather than erroring. */
export function mergeElements(
  defaults: CanvasElement[],
  overrides: ElementOverride[] | null | undefined,
): CanvasElement[] {
  if (!overrides || overrides.length === 0) return defaults;

  const byId = new Map(overrides.map((o) => [o.id, o]));
  const baseIds = new Set(defaults.map((e) => e.id));

  const merged = defaults.map((base) => {
    const o = byId.get(base.id);
    if (!o) return base;
    return {
      ...base,
      section: o.section ?? base.section,
      // Treat a stored empty array the same as "not set" and fall back to the default text.
      // A past backend bug (fixed, but already-saved data may still carry its effect) made
      // Mongoose cast a missing `lines` key to `[]` instead of leaving it absent whenever an
      // override touched any other field (e.g. just a drag/resize) — silently wiping text on
      // untouched cards. `o.lines ?? base.lines` alone doesn't catch that, since `[]` isn't
      // nullish.
      lines: o.lines && o.lines.length > 0 ? o.lines : base.lines,
      ctaLabel: o.ctaLabel ?? base.ctaLabel,
      textColor: o.textColor ?? base.textColor,
      fontSize: o.fontSize ?? base.fontSize,
      bold: o.bold ?? base.bold,
      layouts: {
        mobile: { ...base.layouts.mobile, ...(o.layouts?.mobile ?? {}) },
        desktop: { ...base.layouts.desktop, ...(o.layouts?.desktop ?? {}) },
      },
    };
  });

  const customElements = overrides
    .filter((o) => !baseIds.has(o.id))
    .map(customElementFromOverride)
    .filter((e): e is CanvasElement => e !== null);

  return [...merged, ...customElements];
}

/** Extracts only the fields that differ from a page's defaults, to keep saved payloads small
 * and so future default tweaks aren't silently masked for untouched elements. */
export function diffElements(defaults: CanvasElement[], edited: CanvasElement[]): ElementOverride[] {
  const baseById = new Map(defaults.map((e) => [e.id, e]));
  const overrides: ElementOverride[] = [];

  for (const e of edited) {
    const base = baseById.get(e.id);
    if (!base) {
      // Custom (admin-added) element — no default to diff against, save it in full.
      overrides.push({
        id: e.id,
        section: e.section,
        kind: e.kind,
        src: e.src,
        alt: e.alt,
        emoji: e.emoji,
        lines: e.lines,
        ctaLabel: e.ctaLabel,
        href: e.href,
        background: e.background,
        shape: e.shape,
        textStyle: e.textStyle,
        textColor: e.textColor,
        fontSize: e.fontSize,
        bold: e.bold,
        isCustom: true,
        layouts: { mobile: e.layouts.mobile, desktop: e.layouts.desktop },
      });
      continue;
    }

    const override: ElementOverride = { id: e.id };
    let changed = false;

    if (e.section !== base.section) {
      override.section = e.section;
      changed = true;
    }
    if (JSON.stringify(e.lines) !== JSON.stringify(base.lines)) {
      override.lines = e.lines;
      changed = true;
    }
    if (e.ctaLabel !== base.ctaLabel) {
      override.ctaLabel = e.ctaLabel;
      changed = true;
    }
    if (e.textColor !== base.textColor) {
      override.textColor = e.textColor;
      changed = true;
    }
    if (e.fontSize !== base.fontSize) {
      override.fontSize = e.fontSize;
      changed = true;
    }
    if (e.bold !== base.bold) {
      override.bold = e.bold;
      changed = true;
    }

    const layoutDiff: ElementOverride["layouts"] = {};
    (["mobile", "desktop"] as const).forEach((bp) => {
      const a = e.layouts[bp];
      const b = base.layouts[bp];
      if (
        a.x !== b.x ||
        a.y !== b.y ||
        a.scale !== b.scale ||
        a.rotation !== b.rotation ||
        a.visible !== b.visible ||
        a.zIndex !== b.zIndex
      ) {
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

interface SectionWithBackground {
  id: string;
  background?: string;
}

/** Merges admin-saved section background overrides onto each section's default, keyed by
 * section id. Sections with no override keep their default background. */
export function mergeSectionBackgrounds(
  sections: SectionWithBackground[],
  overrides: SectionBackgroundOverride[] | null | undefined,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const section of sections) {
    result[section.id] = section.background ?? "";
  }
  for (const o of overrides ?? []) {
    if (o.id in result) result[o.id] = o.background;
  }
  return result;
}

/** Extracts only the section backgrounds that differ from default. */
export function diffSectionBackgrounds(
  sections: SectionWithBackground[],
  edited: Record<string, string>,
): SectionBackgroundOverride[] {
  const overrides: SectionBackgroundOverride[] = [];
  for (const section of sections) {
    const current = edited[section.id];
    if (current !== undefined && current !== section.background) {
      overrides.push({ id: section.id, background: current });
    }
  }
  return overrides;
}
