/** One breakpoint's placement for a canvas element. Position is percent-based and
 * center-anchored (like the existing ImageSticker convention) so it scales with the
 * canvas regardless of device width. */
export interface ElementLayout {
  x: number; // percent, center of element, left edge of section canvas = 0
  y: number; // percent, center of element, top edge of section canvas = 0
  scale: number; // 1 = the element's default size
  rotation: number; // degrees
  visible: boolean;
}

export type CardBackground = "yellow" | "pink" | "blue" | "lavender" | "white" | "none" | "dark";
export type CardShape = "sticky" | "polaroid" | "bubble-left" | "bubble-right" | "torn" | "plain" | "quote";

/** A single draggable/resizable/rotatable/removable unit on the home screen. Whole
 * cards/stickers are the editing unit (not individual words inside a card) — text is
 * edited as a block of lines via the admin side panel. */
export interface CanvasElement {
  id: string;
  section: number; // index into HOME_SECTIONS
  kind: "image" | "card";
  // image kind
  src?: string;
  alt?: string;
  // card kind
  emoji?: string;
  lines?: string[];
  ctaLabel?: string;
  href?: string;
  background?: CardBackground;
  shape?: CardShape;
  textStyle?: "heading" | "body" | "quote";
  layouts: {
    mobile: ElementLayout;
    desktop: ElementLayout;
  };
}

export interface HomeSectionDef {
  id: string;
  label: string;
  /** Reference canvas size elements are positioned against, per breakpoint. */
  canvas: {
    mobile: { width: number; height: number };
    desktop: { width: number; height: number };
  };
  background?: string; // CSS background value
}

export type Breakpoint = "mobile" | "desktop";

/** What the backend stores per element: only the fields an admin can actually change. */
export interface ElementOverride {
  id: string;
  lines?: string[];
  ctaLabel?: string;
  layouts?: {
    mobile?: Partial<ElementLayout>;
    desktop?: Partial<ElementLayout>;
  };
}
