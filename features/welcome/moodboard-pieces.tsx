"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export const NOTE_COLORS = {
  yellow: "bg-[#fff3b0]",
  pink: "bg-[#ffd6e8]",
  blue: "bg-[#cfeaff]",
  lavender: "bg-[#e3d9ff]",
} as const;

export type NoteColor = keyof typeof NOTE_COLORS;

interface TiltProps {
  rotate?: number;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

/** Generic scroll-triggered "pasted onto the board" entrance. */
export function Pasted({ rotate = 0, delay = 0, className, children }: TiltProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: rotate * 2.2, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, rotate, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ rotate: 0, scale: 1.04, zIndex: 20 }}
      className={cn("relative", className)}
      style={{ rotate: `${rotate}deg` }}
    >
      {children}
    </motion.div>
  );
}

export function Tape({ rotate = -5, className }: { rotate?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("tape absolute -top-4 left-1/2 -z-0", className)}
      style={{ ["--tape-rotate" as string]: `${rotate}deg` }}
    />
  );
}

export function StickyNote({
  color = "yellow",
  rotate = -3,
  delay = 0,
  tape = true,
  className,
  children,
}: {
  color?: NoteColor;
  rotate?: number;
  delay?: number;
  tape?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Pasted
      rotate={rotate}
      delay={delay}
      className={cn(
        "w-full max-w-[240px] p-5 text-[#3a2e2a] shadow-[3px_5px_14px_rgba(58,46,42,0.15)] lg:max-w-[280px] lg:p-6",
        NOTE_COLORS[color],
        tape && "tape",
        className,
      )}
    >
      {children}
    </Pasted>
  );
}

export function Polaroid({
  rotate = -2,
  delay = 0,
  caption,
  emoji,
  className,
}: {
  rotate?: number;
  delay?: number;
  caption: string;
  emoji: string;
  className?: string;
}) {
  return (
    <Pasted
      rotate={rotate}
      delay={delay}
      className={cn(
        "w-full max-w-[200px] border border-black/5 bg-white p-3 pb-5 shadow-[4px_6px_16px_rgba(58,46,42,0.18)] lg:max-w-[240px] lg:p-4 lg:pb-6",
        className,
      )}
    >
      <div className="flex aspect-square items-center justify-center rounded-sm bg-gradient-to-br from-[#fdf6ee] to-[#f3e6d5] text-6xl lg:text-7xl">
        {emoji}
      </div>
      <p className="mt-3 text-center text-xl text-[#3a2e2a] font-[family-name:var(--font-caveat-mood)] lg:text-2xl">
        {caption}
      </p>
    </Pasted>
  );
}

/** A die-cut style sticker: emoji centered on a white, rounded, drop-shadowed backing —
 * echoing the thick white borders on illustrated sticker sheets. */
export function Sticker({
  children,
  className,
  bobDelay = 0,
  bobRotate = 0,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  bobDelay?: number;
  bobRotate?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "animate-bob pointer-events-none absolute flex aspect-square select-none items-center justify-center rounded-full border-[3px] border-white bg-white leading-none shadow-[2px_5px_12px_rgba(58,46,42,0.28)]",
        className,
      )}
      style={{
        animationDelay: `${bobDelay}s`,
        padding: "0.3em",
        ["--bob-rotate" as string]: `${bobRotate}deg`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

interface ScatterSpec {
  emoji: string;
  top: number;
  left: number;
  size: string;
  bobDelay: number;
  bobRotate: number;
}

/** Four edge pockets — keeps stickers off the centered content column while still feeling
 * scattered. Each is [topRange, leftRange] as percentages of the section box. */
const CORNER_POCKETS: [number, number, number, number][] = [
  [4, 20, 2, 20], // top-left
  [4, 20, 80, 96], // top-right
  [76, 94, 2, 20], // bottom-left
  [76, 94, 80, 96], // bottom-right
];

/**
 * Scatters a set of emoji stickers at pseudo-random positions in the section's four corner
 * pockets (never the centered content column), each with its own size/rotation/bob timing —
 * reshuffled (seeded by section index) on every mount so the board doesn't look identical on
 * repeat visits. Renders nothing until mounted to avoid an SSR/client markup mismatch, since
 * positions are only computed in the browser.
 */
export function StickerField({
  emojis,
  seed,
  pockets = CORNER_POCKETS,
}: {
  emojis: string[];
  seed: number;
  pockets?: [number, number, number, number][];
}) {
  const [specs, setSpecs] = useState<ScatterSpec[] | null>(null);

  useEffect(() => {
    const rand = seededRandom(seed * 7919 + Date.now());
    const sizes = ["text-3xl", "text-4xl", "text-5xl"];
    const order = pockets
      .map((pocket, i) => ({ pocket, sort: rand(), i }))
      .sort((a, b) => a.sort - b.sort);

    setSpecs(
      emojis.map((emoji, i) => {
        const [topMin, topMax, leftMin, leftMax] = order[i % order.length].pocket;
        return {
          emoji,
          top: topMin + rand() * (topMax - topMin),
          left: leftMin + rand() * (leftMax - leftMin),
          size: sizes[Math.floor(rand() * sizes.length)],
          bobDelay: rand() * 2,
          bobRotate: rand() * 14 - 7,
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!specs) return null;

  return (
    <>
      {specs.map((s, i) => (
        <Sticker
          key={i}
          className={s.size}
          bobDelay={s.bobDelay}
          bobRotate={s.bobRotate}
          style={{ top: `${s.top}%`, left: `${s.left}%` }}
        >
          {s.emoji}
        </Sticker>
      ))}
    </>
  );
}

export function ScribbleArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={cn("pointer-events-none absolute h-10 w-16 text-[#3a2e2a]", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
    >
      <path d="M4 10c20 0 55-6 74 8-10 1-18 5-24 11m24-11c-6 4-10 12-11 20" />
    </svg>
  );
}

export function ScribbleCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={cn("pointer-events-none absolute text-[#e0568c]", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
    >
      <path d="M60 8C30 6 8 20 10 34c2 16 30 24 54 22 26-2 46-14 44-26C106 16 78 8 56 10" />
    </svg>
  );
}

export function Highlight({
  color = "#fef08a",
  className,
  children,
}: {
  color?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn("marker-highlight font-semibold", className)}
      style={{ ["--highlight-color" as string]: color }}
    >
      {children}
    </span>
  );
}
