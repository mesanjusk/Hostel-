import { CanvasElementView } from "@/features/welcome/canvas-element-view";
import { CANVAS_WIDTH } from "@/features/welcome/canvas-types";
import type { Breakpoint, CanvasElement, HomeSectionDef } from "@/features/welcome/canvas-types";

export function SectionCanvas({
  section,
  sectionIdx,
  elements,
  breakpoint,
  background,
  context,
}: {
  section: HomeSectionDef;
  sectionIdx: number;
  elements: CanvasElement[];
  breakpoint: Breakpoint;
  background?: string;
  context?: "guide";
}) {
  const { width, height } = section.canvas[breakpoint];
  const sectionElements = elements.filter((e) => e.section === sectionIdx);

  return (
    <div
      className="relative mx-auto w-full overflow-hidden"
      // Capped at the same width the admin editor previews at (CANVAS_WIDTH) — without this,
      // this section would stretch to the full browser width on any monitor wider than that,
      // making stickers/text look progressively smaller than what the admin saw while
      // editing, the reported "admin preview doesn't match the live site" mismatch.
      style={{
        aspectRatio: `${width} / ${height}`,
        background: background ?? section.background,
        maxWidth: CANVAS_WIDTH[breakpoint],
      }}
    >
      {sectionElements.map((element) => (
        <CanvasElementView key={element.id} element={element} breakpoint={breakpoint} context={context} />
      ))}
    </div>
  );
}
