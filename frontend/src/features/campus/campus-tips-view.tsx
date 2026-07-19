import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { api, ApiError } from "@/lib/api";
import { CAMPUS_TIP_CATEGORIES } from "@/types";
import { TipCard } from "@/features/campus/tip-card";
import { TipFormDialog } from "@/features/campus/tip-form-dialog";
import { toCampusTipDTO, type CampusTipDTO, type CampusTipRaw } from "@/features/campus/campus-tip-dto";

const ANY = "__any__";

/** @param college - the student's own college, from their profile, shown only for copy (the
 * server derives the actual campus scope itself — see campusTips.routes.ts's ownCampus — so
 * there's nothing here to trust). Like Explore, there's no campus picker: this page is about
 * the one campus that's relevant to them. */
export function CampusTipsView({ college }: { college: string }) {
  const [category, setCategory] = useState("");
  // null until the first fetch resolves, so the page doesn't flash the empty state — same
  // pattern as places-view.
  const [tips, setTips] = useState<CampusTipDTO[] | null>(null);

  async function fetchTips() {
    // No city/college here — the server always scopes to the caller's own profile, so a
    // student can never fetch (or, via TipFormDialog, post) another campus's tips.
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    try {
      const { tips: raw } = await api.get<{ tips: CampusTipRaw[] }>(`/api/campus-tips?${params.toString()}`);
      setTips(raw.map(toCampusTipDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load tips");
    }
  }

  useEffect(() => {
    fetchTips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  /** New tips join at the top rather than re-sorting mid-read: a fresh tip has score 0 and
   * strict score-order would bury it instantly. Server order returns on the next fetch. */
  function handleCreated(tip: CampusTipDTO) {
    setTips((prev) => [tip, ...(prev ?? [])]);
  }

  function handleDeleted(id: string) {
    setTips((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={category || ANY} onValueChange={(v) => setCategory(v === ANY ? "" : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All categories</SelectItem>
            {CAMPUS_TIP_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <TipFormDialog college={college} onSaved={handleCreated} />
        </div>
      </div>

      {tips === null ? null : tips.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No tips yet"
          description={`Know something useful about ${college}? Be the first to share it.`}
          action={<TipFormDialog college={college} onSaved={handleCreated} />}
        />
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
          {tips.map((tip) => (
            <div key={tip.id} className="mb-4 break-inside-avoid">
              <TipCard tip={tip} onDeleted={handleDeleted} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
