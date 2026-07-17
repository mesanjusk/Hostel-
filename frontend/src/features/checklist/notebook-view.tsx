import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Rows3 } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { NotebookPage } from "@/features/checklist/notebook-page";
import { DownloadPdfButton } from "@/features/checklist/download-pdf-button";
import type { ChecklistPlanType } from "@/types";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

const PLAN_TYPE_TABS: { type: ChecklistPlanType; label: string }[] = [
  { type: "pack", label: "Pack it" },
  { type: "plan", label: "Plan it" },
];

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

/** A small decorative sticker pinned to a fixed spot on the notebook's outer chrome. */
function CornerSticker({ slug, alt, className }: { slug: string; alt: string; className: string }) {
  return (
    <img
      src={`/stickers/${slug}.webp`}
      alt={alt}
      draggable={false}
      className={cn(
        "pointer-events-none absolute z-30 size-11 object-contain drop-shadow-[2px_4px_8px_rgba(58,46,42,0.3)] sm:size-14 lg:size-16",
        className,
      )}
    />
  );
}

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
 * flies off toward the side it came from. */
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
  /** Every item starts (and stays) under "Pack it" until the user explicitly moves it to
   * "Plan it" — so unlike a normal filter, one of these two tabs is always active. */
  const [planTypeFilter, setPlanTypeFilter] = useState<ChecklistPlanType>("pack");

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const total = groups.length;
  const current = groups[index];
  const overallPercent = overall.total > 0 ? Math.round((overall.completed / overall.total) * 100) : 0;

  function updateCategoryItems(category: string, updater: (prev: ChecklistItemDTO[]) => ChecklistItemDTO[]) {
    setGroups((prev) => prev.map((g) => (g.category === category ? { ...g, items: updater(g.items) } : g)));
  }

  /** Categories loop: past the last page it wraps to the first, and vice versa. */
  function goTo(next: number) {
    if (total === 0) return;
    setDirection(next > index ? 1 : next < index ? -1 : direction);
    setIndex(((next % total) + total) % total);
  }

  if (total === 0 || !current) {
    return <p className="text-muted-foreground py-16 text-center text-sm">No categories yet — add one from the + button.</p>;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#3a2e2a]">Overall progress</p>
          <p className="text-xs text-[#8a7a6a]">
            {overall.completed} / {overall.total} items packed
          </p>
          <Progress value={overallPercent} className="mt-1.5 h-1.5" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DownloadPdfButton groups={groups} overall={overall} iconOnly />
          <Link
            to="/checklist?view=list"
            aria-label="List view"
            title="List view"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e9ddc9] bg-white text-[#8a7a6a] transition-colors hover:text-[#3a2e2a]"
          >
            <Rows3 className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-md lg:max-w-4xl xl:max-w-5xl">
        <div
          aria-hidden
          className="absolute inset-0 translate-x-2 translate-y-3 rotate-1 rounded-[22px] bg-[#e4d4bb]/60"
        />
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
        <CornerSticker
          {...pickSticker(index * 3 + 1)}
          className="-top-4 -left-3 rotate-[-10deg] sm:-top-5 sm:-left-4"
        />
        <CornerSticker
          {...pickSticker(index * 3 + 2)}
          className="-bottom-4 -left-3 rotate-[12deg] sm:-bottom-5 sm:-left-4"
        />

        <div className="absolute top-1/2 right-0 z-40 flex -translate-y-1/2 translate-x-1/4 flex-col gap-3">
          {PLAN_TYPE_TABS.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => setPlanTypeFilter(type)}
              aria-pressed={planTypeFilter === type}
              className={cn(
                "rounded-r-xl border border-l-0 px-3.5 py-2 text-base shadow-sm transition-colors sm:px-4 sm:py-2.5 sm:text-lg",
                planTypeFilter === type
                  ? "border-[#c96b9a] bg-[#c96b9a] text-white"
                  : "border-[#e9ddc9] bg-white text-[#8a7a6a] hover:text-[#3a2e2a]",
              )}
              style={{ fontFamily: "var(--font-caveat-notebook)" }}
            >
              {label}
            </button>
          ))}
        </div>

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
                planTypeFilter={planTypeFilter}
                onItemsChange={(u) => updateCategoryItems(current.category, u)}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous page"
          className="flex size-10 items-center justify-center rounded-full bg-white text-[#3a2e2a] shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="min-w-[64px] text-center text-sm font-medium text-[#8a7a6a] tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next page"
          className="flex size-10 items-center justify-center rounded-full bg-white text-[#3a2e2a] shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
