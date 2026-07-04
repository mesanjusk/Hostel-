"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Caveat } from "next/font/google";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Rows3 } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { NotebookPage } from "@/features/checklist/notebook-page";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

/** Curated for a plain notebook margin doodle feel — no event-specific stickers. */
const PAGE_STICKERS = [
  { slug: "evil-eye", alt: "evil eye sticker" },
  { slug: "bow", alt: "bow sticker" },
  { slug: "bow-2", alt: "bow sticker" },
  { slug: "cherries", alt: "cherries sticker" },
  { slug: "tulips-bouquet", alt: "tulips bouquet sticker" },
  { slug: "sleepy-moon", alt: "sleepy moon sticker" },
  { slug: "potted-plant", alt: "potted plant sticker" },
  { slug: "note-to-self", alt: "note to self sticker" },
  { slug: "trust-the-process", alt: "trust the process sticker" },
  { slug: "small-steps-every-day", alt: "small steps every day sticker" },
  { slug: "good-things-coming", alt: "good things are coming sticker" },
  { slug: "choose-happy", alt: "choose happy sticker" },
];

function pickSticker(seed: number) {
  const i = ((seed % PAGE_STICKERS.length) + PAGE_STICKERS.length) % PAGE_STICKERS.length;
  return PAGE_STICKERS[i];
}

/** A dark punched hole drilled through the paper — sits just inside the page's top margin,
 * peeking through the gap of the wire loop threaded above it. */
function PunchHole({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block shrink-0 rounded-full bg-[#2b2620]", className)}
      style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.35)" }}
    />
  );
}

/** A single loop of a dark wire spiral coil — an open, elongated ring (not a filled disc) so
 * the page pattern shows through its center, matching a real notebook's coil binding. */
function CoilRing({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block shrink-0 rounded-[50%]", className)}
      style={{
        border: "2.5px solid #232226",
        background:
          "linear-gradient(155deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0.18) 62%, rgba(255,255,255,0) 100%)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.5)",
      }}
    />
  );
}

/** A small decorative sticker pinned to a fixed spot on the notebook's outer chrome (not the
 * paper itself) — half hanging over the backing board, half over the page's rounded corner.
 * Fixed position (never scattered), so it can never drift over the title or item list, no
 * matter how long the category name or how many items a page has. */
function CornerSticker({
  slug,
  alt,
  className,
}: {
  slug: string;
  alt: string;
  className: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative, variable aspect ratio
    <img
      src={`/stickers/${slug}.png`}
      alt={alt}
      draggable={false}
      className={cn(
        "animate-bob pointer-events-none absolute z-30 size-11 object-contain drop-shadow-[2px_4px_8px_rgba(58,46,42,0.3)] sm:size-14 lg:size-16",
        className,
      )}
    />
  );
}

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat-notebook",
});

interface CategoryGroup {
  category: string;
  items: ChecklistItemDTO[];
}

interface OverallProgress {
  total: number;
  completed: number;
}

const SWIPE_THRESHOLD = 8000;
function swipePower(offset: number, velocity: number) {
  return Math.abs(offset) * velocity;
}

const SPRING = { type: "spring" as const, stiffness: 280, damping: 28 };

/** Direction-aware page-turn: the incoming page rises in from beneath, the outgoing page
 * flies off toward the side it came from. The corner-peel highlight (see notebook-page.tsx)
 * is driven by this same "exit" state via variant propagation. */
const pageVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, scale: 0.94, y: 18, rotate: dir > 0 ? 3 : -3 }),
  center: { opacity: 1, scale: 1, y: 0, rotate: 0 },
  exit: (dir: number) => ({
    opacity: 0,
    scale: 0.9,
    x: dir > 0 ? -70 : 70,
    y: -60,
    rotate: dir > 0 ? -18 : 18,
  }),
};

export function NotebookView({
  groups: initialGroups,
  overall,
  allCategories,
}: {
  groups: CategoryGroup[];
  overall: OverallProgress;
  allCategories: string[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Re-sync from the server whenever fresh props arrive (e.g. after router.refresh()
  // following an add/edit elsewhere, like the FAB), since this component's own local
  // `groups` state would otherwise keep showing whatever it had at mount.
  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const total = groups.length;
  const current = groups[index];
  const overallPercent =
    overall.total > 0 ? Math.round((overall.completed / overall.total) * 100) : 0;

  function updateCategoryItems(
    category: string,
    updater: (prev: ChecklistItemDTO[]) => ChecklistItemDTO[],
  ) {
    setGroups((prev) =>
      prev.map((g) => (g.category === category ? { ...g, items: updater(g.items) } : g)),
    );
  }

  function goTo(next: number) {
    if (next < 0 || next >= total || !groups[next]) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  if (total === 0 || !current) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        No categories yet — add one from the + button.
      </p>
    );
  }

  return (
    <div className={caveat.variable}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#3a2e2a]">Overall progress</p>
          <p className="text-xs text-[#8a7a6a]">
            {overall.completed} / {overall.total} items packed
          </p>
          <Progress value={overallPercent} className="mt-1.5 h-1.5" />
        </div>
        <Link
          href="/checklist?view=list"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#e9ddc9] bg-white px-3 py-1.5 text-xs font-medium text-[#8a7a6a] transition-colors hover:text-[#3a2e2a]"
        >
          <Rows3 className="size-3.5" />
          List view
        </Link>
      </div>

      <div className="relative mx-auto w-full max-w-md lg:max-w-4xl xl:max-w-5xl">
        {/* translucent backing board, peeking out behind the page stack */}
        <div
          aria-hidden
          className="absolute inset-0 translate-x-2 translate-y-3 rotate-1 rounded-[22px] bg-[#e4d4bb]/60"
        />
        {/* stacked page-edge depth layers */}
        {[2, 1].map((offset) => (
          <div
            key={offset}
            aria-hidden
            className="absolute inset-0 rounded-[20px] bg-white"
            style={{
              transform: `translate(${offset * 2}px, ${offset * 3}px) rotate(${offset * 0.7}deg)`,
              opacity: 0.55 - offset * 0.15,
            }}
          />
        ))}
        {/* holes punched through the paper's top margin */}
        <div className="pointer-events-none absolute top-2 right-9 left-9 z-20 flex justify-between sm:top-2.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <PunchHole key={i} className="size-2 sm:size-2.5" />
          ))}
        </div>
        {/* dark wire spiral coil, threaded through the holes and straddling the page edge */}
        <div className="pointer-events-none absolute -top-3 right-9 left-9 z-30 flex justify-between sm:-top-3.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <CoilRing key={i} className="h-5 w-3 sm:h-6 sm:w-3.5" />
          ))}
        </div>

        {/* fixed-position corner stickers, pinned outside the page's own paper rectangle so
            they never sit over the title or item list — only the art rotates per page. */}
        <CornerSticker
          {...pickSticker(index * 3 + 1)}
          className="-top-4 -left-3 rotate-[-10deg] sm:-top-5 sm:-left-4"
        />
        <CornerSticker
          {...pickSticker(index * 3 + 2)}
          className="-bottom-4 -left-3 rotate-[12deg] sm:-bottom-5 sm:-left-4"
        />

        <div className="relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={current.category}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_e, info) => {
                const power = swipePower(info.offset.x, info.velocity.x);
                if (power < -SWIPE_THRESHOLD || info.offset.x < -100) goTo(index + 1);
                else if (power > SWIPE_THRESHOLD || info.offset.x > 100) goTo(index - 1);
              }}
              whileHover={{ y: -2 }}
            >
              <NotebookPage
                category={current.category}
                allCategories={allCategories}
                items={current.items}
                onItemsChange={(u) => updateCategoryItems(current.category, u)}
                onNavigate={(dir) => goTo(index + dir)}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous page"
          className="flex size-10 items-center justify-center rounded-full bg-white text-[#3a2e2a] shadow-sm transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="min-w-[64px] text-center text-sm font-medium text-[#8a7a6a] tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === total - 1}
          aria-label="Next page"
          className="flex size-10 items-center justify-center rounded-full bg-white text-[#3a2e2a] shadow-sm transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
