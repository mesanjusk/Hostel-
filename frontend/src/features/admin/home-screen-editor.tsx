import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Moveable from "react-moveable";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { HOME_SECTIONS, sectionIndex } from "@/features/welcome/home-sections";
import { DEFAULT_HOME_ELEMENTS } from "@/features/welcome/home-elements-default";
import { diffHomeElements, mergeHomeElements } from "@/features/welcome/home-elements-merge";
import { ElementBody } from "@/features/welcome/canvas-element-view";
import type { Breakpoint, CanvasElement, ElementLayout, ElementOverride } from "@/features/welcome/canvas-types";

const BREAKPOINTS: Breakpoint[] = ["mobile", "desktop"];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.x, layout.y, layout.rotation, layout.scale, containerSize.width, containerSize.height, element.id]);

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
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("mobile");
  const [sectionId, setSectionId] = useState(HOME_SECTIONS[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [, forceRerender] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
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
      .get<{ elements: ElementOverride[] | null }>("/api/landing/design")
      .then((res) => setElements(mergeHomeElements(res.elements)))
      .catch(() => toast.error("Failed to load the current design"));
  }, []);

  useEffect(() => {
    setSelectedId(null);
  }, [sectionId, breakpoint]);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setContainerSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    }
    measure();
    const id = window.setTimeout(measure, 50);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(id);
    };
  }, [sectionId, breakpoint]);

  const section = HOME_SECTIONS.find((s) => s.id === sectionId)!;
  const idx = sectionIndex(sectionId);
  const sectionElements = useMemo(() => elements.filter((e) => e.section === idx), [elements, idx]);
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

  function resetElement(id: string) {
    const base = DEFAULT_HOME_ELEMENTS.find((e) => e.id === id);
    if (!base) return;
    setElements((current) => current.map((e) => (e.id === id ? { ...base } : e)));
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const overrides = diffHomeElements(elements);
      await api.put("/api/admin/landing-design", { elements: overrides });
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

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>Home screen</CardTitle>
            <div className="flex gap-1 rounded-full bg-muted p-1">
              {BREAKPOINTS.map((bp) => (
                <button
                  key={bp}
                  type="button"
                  onClick={() => setBreakpoint(bp)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    breakpoint === bp ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {bp}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1">
              {HOME_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSectionId(s.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    sectionId === s.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <p className="text-muted-foreground text-xs">
              Tap a card or sticker to select it, then drag to move, use the corner handle to resize, and the top
              handle to rotate. Edits apply to the {breakpoint} layout only.
            </p>

            <div
              ref={containerRef}
              onClick={() => setSelectedId(null)}
              className="relative mx-auto w-full max-w-xl overflow-hidden rounded-xl border"
              style={{ aspectRatio: `${canvas.width} / ${canvas.height}`, background: section.background }}
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
              {selected && selectedNode && containerSize.width > 0 && (
                <Moveable
                  target={selectedNode}
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
                    const x = ((leftPx + w / 2) / containerSize.width) * 100;
                    const y = ((topPx + h / 2) / containerSize.height) * 100;
                    updateElementLayout(selected.id, { x, y });
                  }}
                  onScale={({ target, transform }) => {
                    (target as HTMLElement).style.transform = transform;
                  }}
                  onScaleEnd={({ target }) => {
                    const el = target as HTMLElement;
                    const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
                    const scale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
                    updateElementLayout(selected.id, { scale: Math.round(scale * 100) / 100 });
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

                {selected.ctaLabel !== undefined && (
                  <div className="flex flex-col gap-2">
                    <Label>Button label</Label>
                    <Input
                      value={selected.ctaLabel}
                      onChange={(e) => updateElementCta(selected.id, e.target.value)}
                    />
                  </div>
                )}

                <Button variant="outline" onClick={() => resetElement(selected.id)}>
                  <RotateCcw className="size-4" />
                  Reset this block
                </Button>
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
