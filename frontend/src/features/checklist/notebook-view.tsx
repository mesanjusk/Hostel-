import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { NotebookCategorySection } from "@/features/checklist/notebook-category-section";
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

export function NotebookView({
  groups: initialGroups,
  allCategories,
}: {
  groups: CategoryGroup[];
  allCategories: string[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  function updateCategoryItems(category: string, updater: (prev: ChecklistItemDTO[]) => ChecklistItemDTO[]) {
    setGroups((prev) => prev.map((g) => (g.category === category ? { ...g, items: updater(g.items) } : g)));
  }

  function toggleExpanded(category: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  if (groups.length === 0) {
    return <p className="text-muted-foreground py-16 text-center text-sm">No categories yet — add one from the + button.</p>;
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-md lg:max-w-4xl xl:max-w-5xl">
        <h1
          className="mb-3 text-4xl text-[#3a2e2a] sm:text-5xl lg:text-6xl"
          style={{ fontFamily: "var(--font-caveat-notebook)" }}
        >
          Checklist
        </h1>
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
        <CornerSticker {...pickSticker(1)} className="-top-4 -left-3 rotate-[-10deg] sm:-top-5 sm:-left-4" />
        <CornerSticker {...pickSticker(2)} className="-bottom-4 -left-3 rotate-[12deg] sm:-bottom-5 sm:-left-4" />

        <div className="exam-paper relative flex flex-col overflow-hidden rounded-[20px] border border-[#e9ddc9] p-5 shadow-[0_2px_14px_rgba(58,46,42,0.14)] sm:p-8 lg:p-10">
          {groups.map((group, i) => (
            <NotebookCategorySection
              key={group.category}
              category={group.category}
              allCategories={allCategories}
              items={group.items}
              expanded={expanded.has(group.category)}
              onToggleExpanded={() => toggleExpanded(group.category)}
              onItemsChange={(u) => updateCategoryItems(group.category, u)}
              isLast={i === groups.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
