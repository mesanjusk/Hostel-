import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Moveable from "react-moveable";
import { toast } from "sonner";
import { Eye, ImagePlus, RotateCcw, StickyNote, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { HOME_SECTIONS, sectionIndex } from "@/features/welcome/home-sections";
import { DEFAULT_HOME_ELEMENTS } from "@/features/welcome/home-elements-default";
import {
  diffHomeElements,
  diffSectionBackgrounds,
  mergeHomeElements,
  mergeSectionBackgrounds,
} from "@/features/welcome/home-elements-merge";
import { ElementBody } from "@/features/welcome/canvas-element-view";
import {
  SECTION_BACKGROUND_PRESETS,
  SECTION_BACKGROUND_PRESET_LABELS,
  type SectionBackgroundPresetId,
} from "@/features/welcome/section-background-presets";
import type {
  Breakpoint,
  CanvasElement,
  ElementLayout,
  ElementOverride,
  SectionBackgroundOverride,
} from "@/features/welcome/canvas-types";

const PRESET_IDS = Object.keys(SECTION_BACKGROUND_PRESETS) as SectionBackgroundPresetId[];

const BREAKPOINTS: Breakpoint[] = ["mobile", "desktop"];

/** Real device widths (CSS px) the canvas renders at — not just an aspect ratio — so
 * fixed-size cards/text actually look phone-sized vs desktop-sized, like a browser's
 * device toolbar. The visible box is then scaled down to fit the editor panel. */
const PREVIEW_WIDTH: Record<Breakpoint, number> = { mobile: 390, desktop: 1280 };

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB — uploaded images are stored inline as base64

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function generateElementId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function elementLabel(e: CanvasElement): string {
  return e.lines?.[0] || e.alt || e.emoji || (e.kind === "image" ? "Sticker" : "Card");
}

/** Newly-added stickers/cards used to all land at the same dead-center (50, 50) spot, so
 * adding more than one without immediately dragging it away stacked them directly on top of
 * each other (and of whatever content already sat there) — hiding text underneath. Cascade
 * each new addition diagonally away from center instead. */
function nextInsertLayout(existingCustomCount: number): ElementLayout {
  const step = existingCustomCount % 5;
  const pos = 30 + step * 8; // 30, 38, 46, 54, 62 — then wraps
  return { x: pos, y: pos, scale: 1, rotation: 0, visible: true, zIndex: 0 };
}

function EditableTarget({
  element,
  breakpoint,
  containerSize,
  selected,
  onSelect,
  registerRef,
}: {
  element: CanvasElement;
  breakpoint: Breakpoint;
  containerSize: { width: number; height: number };
  selected: boolean;
  onSelect: () => void;
  registerRef: (id: string, node: HTMLDivElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const layout = element.layouts[breakpoint];

  // Stable identity: an inline ref callback is a new function every render, which makes
  // React call it with null then the node again on every render (even with no DOM change),
  // and that combined with registerRef's setState was causing an infinite render loop.
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      registerRef(element.id, node);
    },
    [element.id, registerRef],
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || !containerSize.width || !containerSize.height) return;
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const leftPx = (layout.x / 100) * containerSize.width - w / 2;
    const topPx = (layout.y / 100) * containerSize.height - h / 2;
    node.style.left = `${leftPx}px`;
    node.style.top = `${topPx}px`;
    node.style.transform = `rotate(${layout.rotation}deg) scale(${layout.scale})`;
    node.style.zIndex = String(layout.zIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    layout.x,
    layout.y,
    layout.rotation,
    layout.scale,
    layout.zIndex,
    containerSize.width,
    containerSize.height,
    element.id,
  ]);

  if (!layout.visible) return null;

  return (
    <div
      ref={setRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "absolute cursor-pointer",
        selected && "outline-primary outline-2 outline-offset-4",
      )}
      style={{ width: element.kind === "image" ? 80 : "max-content" }}
    >
      <ElementBody element={element} />
    </div>
  );
}

export function HomeScreenEditor() {
  const [elements, setElements] = useState<CanvasElement[]>(DEFAULT_HOME_ELEMENTS);
  const [sectionBackgrounds, setSectionBackgrounds] = useState<Record<string, string>>(() =>
    mergeSectionBackgrounds(null),
  );
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("mobile");
  const [sectionId, setSectionId] = useState(HOME_SECTIONS[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [, forceRerender] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Stable identity across renders — an inline arrow function here would make React treat
  // the ref as "changed" on every render (null then re-set), causing an infinite loop when
  // it also triggers a state update.
  const registerRef = useCallback((id: string, node: HTMLDivElement | null) => {
    const current = elementRefs.current.get(id);
    if (node) {
      if (current !== node) {
        elementRefs.current.set(id, node);
        forceRerender((n) => n + 1);
      }
    } else if (current) {
      elementRefs.current.delete(id);
      forceRerender((n) => n + 1);
    }
  }, []);

  useEffect(() => {
    api
      .get<{ elements: ElementOverride[] | null; sectionBackgrounds: SectionBackgroundOverride[] | null }>(
        "/api/landing/design",
      )
      .then((res) => {
        setElements(mergeHomeElements(res.elements));
        setSectionBackgrounds(mergeSectionBackgrounds(res.sectionBackgrounds));
      })
      .catch(() => toast.error("Failed to load the current design"));
  }, []);

  // Measures the editor panel (not the canvas itself, which now renders at a fixed real
  // device width) to compute how much to zoom the canvas down to fit — the same idea as a
  // browser's device toolbar.
  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setAvailableWidth(width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const section = HOME_SECTIONS.find((s) => s.id === sectionId)!;
  const idx = sectionIndex(sectionId);
  const sectionElements = useMemo(() => elements.filter((e) => e.section === idx), [elements, idx]);
  // Hidden elements stop rendering in the canvas entirely, so there's no way to click them
  // to select — this list is the only way back to re-show one without a full reset. Scoped to
  // every section (not just the currently-selected tab), since a hidden element is otherwise
  // easy to "lose" if you're not already on the section tab where you hid it.
  const hiddenElements = useMemo(
    () => elements.filter((e) => !e.layouts[breakpoint].visible),
    [elements, breakpoint],
  );
  const selected = elements.find((e) => e.id === selectedId) ?? null;

  function updateElementLayout(id: string, patch: Partial<ElementLayout>) {
    setElements((current) =>
      current.map((e) =>
        e.id === id
          ? { ...e, layouts: { ...e.layouts, [breakpoint]: { ...e.layouts[breakpoint], ...patch } } }
          : e,
      ),
    );
    setIsDirty(true);
  }

  function updateElementLines(id: string, lines: string[]) {
    setElements((current) => current.map((e) => (e.id === id ? { ...e, lines } : e)));
    setIsDirty(true);
  }

  function updateElementCta(id: string, ctaLabel: string) {
    setElements((current) => current.map((e) => (e.id === id ? { ...e, ctaLabel } : e)));
    setIsDirty(true);
  }

  function updateElementStyle(id: string, patch: Partial<Pick<CanvasElement, "textColor" | "fontSize" | "bold">>) {
    setElements((current) => current.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setIsDirty(true);
  }

  function moveElementToSection(id: string, newSection: number) {
    setElements((current) => current.map((e) => (e.id === id ? { ...e, section: newSection } : e)));
    setSelectedId(null);
    setIsDirty(true);
  }

  function reorderLayer(id: string, direction: "front" | "back") {
    setElements((current) => {
      const target = current.find((e) => e.id === id);
      if (!target) return current;
      const siblings = current.filter((e) => e.section === target.section);
      const zIndexes = siblings.map((e) => e.layouts[breakpoint].zIndex);
      const nextZ = direction === "front" ? Math.max(...zIndexes) + 1 : Math.min(...zIndexes) - 1;
      return current.map((e) =>
        e.id === id ? { ...e, layouts: { ...e.layouts, [breakpoint]: { ...e.layouts[breakpoint], zIndex: nextZ } } } : e,
      );
    });
    setIsDirty(true);
  }

  function resetElement(id: string) {
    const base = DEFAULT_HOME_ELEMENTS.find((e) => e.id === id);
    if (!base) return;
    setElements((current) => current.map((e) => (e.id === id ? { ...base } : e)));
    setIsDirty(true);
  }

  function deleteElement(id: string) {
    setElements((current) => current.filter((e) => e.id !== id));
    setSelectedId(null);
    setIsDirty(true);
  }

  function addBlankCard() {
    const id = generateElementId();
    const layout = nextInsertLayout(sectionElements.filter((e) => e.isCustom).length);
    const newElement: CanvasElement = {
      id,
      section: idx,
      kind: "card",
      shape: "sticky",
      background: "yellow",
      lines: ["New text"],
      isCustom: true,
      layouts: { mobile: { ...layout }, desktop: { ...layout } },
    };
    setElements((current) => [...current, newElement]);
    setSelectedId(id);
    setIsDirty(true);
  }

  async function handleAddSticker(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image is too large — please use one under 2MB");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const id = generateElementId();
      const layout = nextInsertLayout(sectionElements.filter((e) => e.isCustom).length);
      const newElement: CanvasElement = {
        id,
        section: idx,
        kind: "image",
        src: dataUrl,
        alt: "Custom sticker",
        isCustom: true,
        layouts: { mobile: { ...layout }, desktop: { ...layout } },
      };
      setElements((current) => [...current, newElement]);
      setSelectedId(id);
      setIsDirty(true);
    } catch {
      toast.error("Failed to read that image");
    }
  }

  function updateSectionBackground(id: string, background: string) {
    setSectionBackgrounds((current) => ({ ...current, [id]: background }));
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const overrides = diffHomeElements(elements);
      const backgroundOverrides = diffSectionBackgrounds(sectionBackgrounds);
      await api.put("/api/admin/landing-design", { elements: overrides, sectionBackgrounds: backgroundOverrides });
      toast.success("Home screen saved");
      setIsDirty(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  const canvas = section.canvas[breakpoint];
  const selectedNode = selected ? elementRefs.current.get(selected.id) : undefined;

  const previewWidth = PREVIEW_WIDTH[breakpoint];
  const previewHeight = previewWidth * (canvas.height / canvas.width);
  const zoom = availableWidth > 0 ? Math.min(1, availableWidth / previewWidth) : 1;
  const containerSize = { width: previewWidth, height: previewHeight };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>Home screen</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
              <div className="flex gap-1 rounded-full bg-muted p-1">
                {BREAKPOINTS.map((bp) => (
                  <button
                    key={bp}
                    type="button"
                    onClick={() => {
                      setBreakpoint(bp);
                      setSelectedId(null);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                      breakpoint === bp ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    {bp}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1">
              {HOME_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSectionId(s.id);
                    setSelectedId(null);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    sectionId === s.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="size-4" />
                Add sticker from device
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAddSticker(file);
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addBlankCard}>
                <StickyNote className="size-4" />
                Add blank card
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs">Section background</Label>
              {PRESET_IDS.map((presetId) => (
                <button
                  key={presetId}
                  type="button"
                  onClick={() => updateSectionBackground(sectionId, SECTION_BACKGROUND_PRESETS[presetId])}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    sectionBackgrounds[sectionId] === SECTION_BACKGROUND_PRESETS[presetId]
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {SECTION_BACKGROUND_PRESET_LABELS[presetId]}
                </button>
              ))}
              <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
                Custom color
                <input
                  type="color"
                  value={
                    /^#[0-9a-f]{6}$/i.test(sectionBackgrounds[sectionId] ?? "")
                      ? sectionBackgrounds[sectionId]
                      : "#fdf6ee"
                  }
                  onChange={(e) => updateSectionBackground(sectionId, e.target.value)}
                  className="border-border h-6 w-8 cursor-pointer rounded border"
                />
              </label>
            </div>

            <p className="text-muted-foreground text-xs">
              Tap a card or sticker to select it, then drag to move, use the corner handle to resize, and the top
              handle to rotate. Edits apply to the {breakpoint} layout only.
            </p>

            {hiddenElements.length > 0 && (
              <div className="bg-muted flex flex-col gap-2 rounded-xl p-3">
                <Label className="text-xs">Hidden on {breakpoint}, across all sections — tap to show again</Label>
                <div className="flex flex-wrap gap-2">
                  {hiddenElements.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => {
                        const elementSection = HOME_SECTIONS[e.section];
                        if (elementSection && elementSection.id !== sectionId) setSectionId(elementSection.id);
                        setSelectedId(e.id);
                        updateElementLayout(e.id, { visible: true });
                      }}
                      className="border-border bg-card hover:border-foreground flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                    >
                      <Eye className="size-3.5" />
                      {elementLabel(e)}
                      <span className="text-muted-foreground">· {HOME_SECTIONS[e.section]?.label ?? "?"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={panelRef} className="w-full">
              {/* Reserves the zoomed-down footprint so the layout doesn't overflow or leave
                  a blank gap — the canvas below renders at its real device width, then this
                  wrapper's smaller box + the transform below shrink it to fit visually. */}
              <div
                className="mx-auto"
                style={{ width: previewWidth * zoom, height: previewHeight * zoom }}
              >
                <div
                  ref={containerRef}
                  onClick={() => setSelectedId(null)}
                  className={cn(
                    "relative overflow-hidden bg-white",
                    breakpoint === "mobile"
                      ? "rounded-[2rem] border-[10px] border-neutral-800"
                      : "rounded-lg border border-neutral-300",
                  )}
                  style={{
                    width: previewWidth,
                    height: previewHeight,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    background: sectionBackgrounds[sectionId],
                  }}
                >
                  {sectionElements.map((el) => (
                    <EditableTarget
                      key={el.id}
                      element={el}
                      breakpoint={breakpoint}
                      containerSize={containerSize}
                      selected={el.id === selectedId}
                      onSelect={() => setSelectedId(el.id)}
                      registerRef={registerRef}
                    />
                  ))}
                  {selected && selectedNode && (
                    <Moveable
                      target={selectedNode}
                      zoom={zoom}
                      draggable
                      scalable
                      rotatable
                      keepRatio
                      throttleDrag={0}
                      throttleScale={0}
                      throttleRotate={0}
                  onDrag={({ target, left, top }) => {
                    (target as HTMLElement).style.left = `${left}px`;
                    (target as HTMLElement).style.top = `${top}px`;
                  }}
                  onDragEnd={({ target }) => {
                    const el = target as HTMLElement;
                    const w = el.offsetWidth;
                    const h = el.offsetHeight;
                    const leftPx = parseFloat(el.style.left || "0");
                    const topPx = parseFloat(el.style.top || "0");
                    const x = clamp(((leftPx + w / 2) / containerSize.width) * 100, 0, 100);
                    const y = clamp(((topPx + h / 2) / containerSize.height) * 100, 0, 100);
                    updateElementLayout(selected.id, { x, y });
                  }}
                  onScale={({ target, transform }) => {
                    (target as HTMLElement).style.transform = transform;
                  }}
                  onScaleEnd={({ target }) => {
                    const el = target as HTMLElement;
                    const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
                    const scale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
                    // The backend rejects the whole save if any one element's scale falls
                    // outside [0.2, 4] — clamp here so a big resize drag can never produce an
                    // out-of-range value that silently blocks saving everything else.
                    updateElementLayout(selected.id, { scale: clamp(Math.round(scale * 100) / 100, 0.2, 4) });
                  }}
                  onRotate={({ target, transform }) => {
                    (target as HTMLElement).style.transform = transform;
                  }}
                  onRotateEnd={({ target }) => {
                    const el = target as HTMLElement;
                    const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
                    const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
                    updateElementLayout(selected.id, { rotation: Math.round(angle) });
                  }}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selected ? "Edit block" : "Select a block"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {selected ? (
              <>
                <div className="flex items-center justify-between">
                  <Label>Visible on {breakpoint}</Label>
                  <Switch
                    checked={selected.layouts[breakpoint].visible}
                    onCheckedChange={(checked) => updateElementLayout(selected.id, { visible: checked })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Layer order</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => reorderLayer(selected.id, "front")}>
                      Bring to front
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => reorderLayer(selected.id, "back")}>
                      Send to back
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Section</Label>
                  <select
                    value={selected.section}
                    onChange={(e) => moveElementToSection(selected.id, Number(e.target.value))}
                    className="border-input h-10 rounded-lg border bg-transparent px-3 text-sm"
                  >
                    {HOME_SECTIONS.map((s, i) => (
                      <option key={s.id} value={i}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selected.lines && (
                  <div className="flex flex-col gap-2">
                    <Label>Text</Label>
                    {selected.lines.map((line, i) => (
                      <Input
                        key={i}
                        value={line}
                        onChange={(e) => {
                          const next = [...selected.lines!];
                          next[i] = e.target.value;
                          updateElementLines(selected.id, next);
                        }}
                      />
                    ))}
                  </div>
                )}

                {selected.lines && (
                  <div className="flex flex-col gap-2">
                    <Label>Text style</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {(["sm", "md", "lg", "xl"] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateElementStyle(selected.id, { fontSize: size })}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium uppercase transition-colors",
                            selected.fontSize === size
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {size}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateElementStyle(selected.id, { bold: !selected.bold })}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-bold transition-colors",
                          selected.bold
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        B
                      </button>
                      <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        Color
                        <input
                          type="color"
                          value={/^#[0-9a-f]{6}$/i.test(selected.textColor ?? "") ? selected.textColor! : "#3a2e2a"}
                          onChange={(e) => updateElementStyle(selected.id, { textColor: e.target.value })}
                          className="border-border h-6 w-8 cursor-pointer rounded border"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => updateElementStyle(selected.id, { textColor: undefined, fontSize: undefined, bold: undefined })}
                        className="text-muted-foreground text-xs underline underline-offset-2 hover:text-foreground"
                      >
                        Reset style
                      </button>
                    </div>
                  </div>
                )}

                {selected.ctaLabel !== undefined && (
                  <div className="flex flex-col gap-2">
                    <Label>Button label</Label>
                    <Input
                      value={selected.ctaLabel}
                      onChange={(e) => updateElementCta(selected.id, e.target.value)}
                    />
                  </div>
                )}

                {selected.isCustom ? (
                  <Button variant="outline" onClick={() => deleteElement(selected.id)}>
                    <Trash2 className="size-4" />
                    Delete this block
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => resetElement(selected.id)}>
                    <RotateCcw className="size-4" />
                    Reset this block
                  </Button>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Tap a card or sticker on the canvas to edit it.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? "Saving..." : "Save home screen"}
        </Button>
      </div>
    </div>
  );
}
