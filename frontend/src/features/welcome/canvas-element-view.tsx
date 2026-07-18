import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { resolveStickerSrc } from "@/lib/gender-stickers";
import {
  Highlight,
  NOTE_COLORS,
  ScribbleArrow,
  ScribbleCircle,
  type NoteColor,
} from "@/components/shared/scrapbook-pieces";
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
    zIndex: layout.zIndex,
  };
}

const FONT_SIZE_CLASSES: Record<NonNullable<CanvasElement["fontSize"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl",
};

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
      return <div className="relative max-w-[85vw] text-center">{children}</div>;
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

/** Renders one line's text, wrapping a targeted substring in either a <Highlight> marker
 * or a <ScribbleCircle> (per `decoration`). Falls back to plain text if the configured
 * substring can no longer be found in the line (e.g. after an admin text edit). */
function LineContent({ element, line, lineIndex }: { element: CanvasElement; line: string; lineIndex: number }) {
  const highlight = element.highlight?.line === lineIndex ? element.highlight : undefined;
  if (!highlight || !line.includes(highlight.substring)) {
    return line;
  }

  const idx = line.indexOf(highlight.substring);
  const before = line.slice(0, idx);
  const after = line.slice(idx + highlight.substring.length);

  if (element.decoration === "circle") {
    return (
      <>
        {before}
        <span className="relative inline-block px-1">
          <ScribbleCircle preserveAspectRatio="none" className="inset-0 h-full w-full scale-125 opacity-40" />
          <span className="relative">{highlight.substring}</span>
        </span>
        {after}
      </>
    );
  }

  return (
    <>
      {before}
      <Highlight color={highlight.color}>{highlight.substring}</Highlight>
      {after}
    </>
  );
}

function CtaLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className =
    "mt-6 inline-block rotate-[-1deg] rounded-full bg-[#3a2e2a] px-7 py-3 text-sm font-bold text-white shadow-[3px_4px_0_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 hover:rotate-0";
  // In-page anchors (`#section-id`) need a plain anchor tag to trigger the browser's native
  // scroll; app routes (`/path`) use react-router's Link so navigating doesn't reload the page.
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

function CardContent({ element }: { element: CanvasElement }) {
  const { user } = useAuth();
  const isHeading = element.textStyle === "heading";
  const isHeroCard = element.isHero === true;
  const hasArrow = element.decoration === "arrow";

  return (
    <>
      {hasArrow && <ScribbleArrow className="-top-6 left-1/2 -translate-x-1/2 rotate-90" />}
      {element.shape === "polaroid" ? (
        (element.src || element.emoji) && (
          <div className="mb-1 flex aspect-square items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br from-[#fdf6ee] to-[#f3e6d5] text-5xl">
            {element.src ? (
              <img
                src={resolveStickerSrc(element.src, user?.gender)}
                alt={element.alt ?? ""}
                className="h-full w-full object-contain drop-shadow-[1px_4px_8px_rgba(58,46,42,0.25)]"
                draggable={false}
              />
            ) : (
              element.emoji
            )}
          </div>
        )
      ) : (
        element.emoji && <p className="text-2xl lg:text-3xl">{element.emoji}</p>
      )}
      {isHeroCard && element.lines && (
        <>
          <p className="text-primary text-sm font-semibold tracking-[0.3em] uppercase">{element.lines[0]}</p>
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
        element.lines?.map((line, i) => {
          const isSpecial = element.specialLine === i;
          return (
            <p
              key={i}
              className={cn(
                isSpecial
                  ? "mt-2 -rotate-3 text-lg text-[#b5453a] sm:text-xl"
                  : i === 0 && isHeading
                    ? "text-3xl font-bold text-[#3a2e2a] sm:text-4xl"
                    : i === 0
                      ? "text-xl leading-snug font-bold text-[#3a2e2a]"
                      : "mt-1 text-base text-[#5a4a3e]",
                element.fontSize && FONT_SIZE_CLASSES[element.fontSize],
                element.bold === true && "font-bold",
                element.bold === false && "font-normal",
              )}
              style={{
                ...(isSpecial || isHeading || element.shape === "quote"
                  ? { fontFamily: "var(--font-caveat-mood)" }
                  : undefined),
                ...(element.textColor ? { color: element.textColor } : undefined),
              }}
            >
              <LineContent element={element} line={line} lineIndex={i} />
            </p>
          );
        })}
      {element.ctaLabel && element.href && <CtaLink href={element.href}>{element.ctaLabel}</CtaLink>}
    </>
  );
}

/** The element's visual content with no positioning applied — reused by both the public
 * page (percent + translate centering) and the admin editor (plain pixel transform, for
 * Moveable compatibility). */
export function ElementBody({ element }: { element: CanvasElement }) {
  const { user } = useAuth();
  if (element.kind === "image") {
    return (
      <img
        src={element.src ? resolveStickerSrc(element.src, user?.gender) : element.src}
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
