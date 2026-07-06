import { cn } from "@/lib/utils";
import { NOTE_COLORS, type NoteColor } from "@/components/shared/scrapbook-pieces";
import type { Breakpoint, CanvasElement, ElementLayout } from "@/features/welcome/canvas-types";

const BUBBLE_COLORS: Record<string, string> = {
  blue: "bg-[#cfeaff] text-[#22415a]",
  pink: "bg-[#ffd6e8] text-[#7a2249]",
  lavender: "bg-[#e3d9ff] text-[#3a2966]",
  yellow: "bg-[#fff3b0] text-[#5a4a3e]",
  white: "bg-white text-[#3a2e2a]",
};

function transformStyle(layout: ElementLayout, useMaxContentWidth = true): React.CSSProperties {
  return {
    position: "absolute",
    left: `${layout.x}%`,
    top: `${layout.y}%`,
    // `width: max-content` avoids a shrink-to-fit sizing bug: an absolutely-positioned box
    // with `left: 50%` and no explicit width computes its "auto" width from the remaining
    // space to the container's right edge (not the full container), which — combined with
    // the translate(-50%) centering below — makes wide content clip or center off-target.
    // Skipped for images, which already size themselves via a Tailwind width class.
    width: useMaxContentWidth ? "max-content" : undefined,
    transform: `translate(-50%, -50%) scale(${layout.scale}) rotate(${layout.rotation}deg)`,
    display: layout.visible ? undefined : "none",
  };
}

function CardChrome({ element, children }: { element: CanvasElement; children: React.ReactNode }) {
  const bg = element.background && element.background !== "none" ? element.background : undefined;

  switch (element.shape) {
    case "sticky":
      return (
        <div
          className={cn(
            "tape w-56 max-w-[80vw] rounded-2xl p-5 text-center shadow-[3px_5px_14px_rgba(58,46,42,0.15)]",
            bg && bg !== "dark" && bg !== "white" ? NOTE_COLORS[bg as NoteColor] : "bg-white",
          )}
        >
          {children}
        </div>
      );
    case "polaroid":
      return (
        <div className="w-48 max-w-[70vw] rounded-md border border-black/5 bg-white p-3 pb-5 shadow-[4px_6px_16px_rgba(58,46,42,0.18)]">
          {children}
        </div>
      );
    case "bubble-left":
    case "bubble-right":
      return (
        <div
          className={cn(
            "max-w-[80vw] rounded-3xl px-5 py-4 text-lg font-semibold shadow-[3px_5px_12px_rgba(58,46,42,0.15)]",
            element.shape === "bubble-left" ? "rounded-bl-md text-left" : "rounded-br-md text-right",
            bg ? BUBBLE_COLORS[bg] : BUBBLE_COLORS.white,
          )}
        >
          {children}
        </div>
      );
    case "torn":
      return (
        <div className="torn-edge w-32 max-w-[40vw] bg-white px-3 py-6 text-center shadow-[3px_5px_12px_rgba(58,46,42,0.15)]">
          {children}
        </div>
      );
    case "quote":
      return <div className="max-w-[85vw] text-center">{children}</div>;
    case "plain":
    default:
      if (bg === "white") {
        return (
          <div className="tape w-80 max-w-[85vw] rounded-3xl bg-white/90 px-8 py-10 text-center shadow-[6px_10px_24px_rgba(58,46,42,0.18)]">
            {children}
          </div>
        );
      }
      return <div className="max-w-[85vw] text-center">{children}</div>;
  }
}

function CardContent({ element }: { element: CanvasElement }) {
  const isHeading = element.textStyle === "heading";
  const isHeroCard = element.id === "hero-card";

  return (
    <>
      {element.emoji && <p className="text-2xl lg:text-3xl">{element.emoji}</p>}
      {isHeroCard && element.lines && (
        <>
          <p className="text-sm font-semibold tracking-[0.3em] text-[#c96b9a] uppercase">{element.lines[0]}</p>
          <h1
            className="mt-2 text-4xl leading-[1.05] font-bold text-[#3a2e2a] sm:text-6xl"
            style={{ fontFamily: "var(--font-caveat-mood)" }}
          >
            {element.lines[1]}
          </h1>
          <p className="mt-4 text-base text-[#6b5c50]">{element.lines[2]}</p>
        </>
      )}
      {!isHeroCard &&
        element.lines?.map((line, i) => (
          <p
            key={i}
            className={cn(
              i === 0 && isHeading
                ? "text-3xl font-bold text-[#3a2e2a] sm:text-4xl"
                : i === 0
                  ? "text-xl leading-snug font-bold text-[#3a2e2a]"
                  : "mt-1 text-base text-[#5a4a3e]",
            )}
            style={isHeading || element.shape === "quote" ? { fontFamily: "var(--font-caveat-mood)" } : undefined}
          >
            {line}
          </p>
        ))}
      {isHeroCard && element.ctaLabel && (
        <a
          href={element.href}
          className="mt-6 inline-block rotate-[-1deg] rounded-full bg-[#3a2e2a] px-7 py-3 text-sm font-bold text-white shadow-[3px_4px_0_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 hover:rotate-0"
        >
          {element.ctaLabel}
        </a>
      )}
    </>
  );
}

/** The element's visual content with no positioning applied — reused by both the public
 * page (percent + translate centering) and the admin editor (plain pixel transform, for
 * Moveable compatibility). */
export function ElementBody({ element }: { element: CanvasElement }) {
  if (element.kind === "image") {
    return (
      <img
        src={element.src}
        alt={element.alt ?? ""}
        className="h-full w-full object-contain drop-shadow-[2px_6px_10px_rgba(58,46,42,0.35)]"
        draggable={false}
      />
    );
  }

  return (
    <CardChrome element={element}>
      <CardContent element={element} />
    </CardChrome>
  );
}

export function CanvasElementView({
  element,
  breakpoint,
  layout,
}: {
  element: CanvasElement;
  breakpoint: Breakpoint;
  layout?: ElementLayout;
}) {
  const effectiveLayout = layout ?? element.layouts[breakpoint];

  if (element.kind === "image") {
    return (
      <span
        style={transformStyle(effectiveLayout, false)}
        className="pointer-events-none block w-20 select-none sm:w-24"
      >
        <ElementBody element={element} />
      </span>
    );
  }

  return (
    <div style={transformStyle(effectiveLayout)}>
      <ElementBody element={element} />
    </div>
  );
}
