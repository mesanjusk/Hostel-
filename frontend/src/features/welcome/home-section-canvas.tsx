import { CanvasElementView } from "@/features/welcome/canvas-element-view";
import { sectionIndex } from "@/features/welcome/home-sections";
import type { Breakpoint, CanvasElement, HomeSectionDef } from "@/features/welcome/canvas-types";

export function HomeSectionCanvas({
  section,
  elements,
  breakpoint,
  background,
}: {
  section: HomeSectionDef;
  elements: CanvasElement[];
  breakpoint: Breakpoint;
  background?: string;
}) {
  const { width, height } = section.canvas[breakpoint];
  const idx = sectionIndex(section.id);
  const sectionElements = elements.filter((e) => e.section === idx);

  return (
    <div
      className="relative mx-auto w-full overflow-hidden"
      style={{ aspectRatio: `${width} / ${height}`, background: background ?? section.background }}
    >
      {sectionElements.map((element) => (
        <CanvasElementView key={element.id} element={element} breakpoint={breakpoint} />
      ))}
    </div>
  );
}
