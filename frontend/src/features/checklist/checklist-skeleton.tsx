import { Skeleton } from "@/components/ui/skeleton";

/** Shown on a cold checklist load (no in-memory or persisted copy to seed from) in place of a
 * blank screen, so the page reads as "loading" rather than "broken." Deliberately mirrors the
 * NotebookView chrome — progress header, the paper card with item rows, page nav — so the real
 * content swaps in without a layout jump. */
export function ChecklistSkeleton() {
  return (
    <div aria-hidden>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-1.5 h-1.5 w-full max-w-xs" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-md lg:max-w-4xl xl:max-w-5xl">
        <div className="rounded-[20px] border border-[#e9ddc9] bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <Skeleton className="h-10 w-40 rounded-md sm:h-12 lg:h-14" />
          <Skeleton className="mt-3 h-3 w-20" />

          <div className="mt-6 space-y-3 lg:mt-8">
            {[88, 72, 80, 64, 76, 68].map((width, i) => (
              <div key={i} className="flex items-center gap-3 py-2 lg:gap-4">
                <Skeleton className="size-6 shrink-0 rounded-md" />
                <Skeleton className="h-5 rounded-md" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="size-10 rounded-full" />
      </div>
    </div>
  );
}
