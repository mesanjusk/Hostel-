import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { api, ApiError } from "@/lib/api";
import { emitRefresh, subscribeRefresh } from "@/lib/refresh-bus";
import { cn } from "@/lib/utils";
import { AddBagDialog } from "@/features/bags/add-bag-dialog";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";
import { BAG_COLOR_PRESETS } from "@/types";

/** Common bag types offered as one-tap presets, in the order they're shown. */
const PRESET_BAGS = [
  "Backpack",
  "Camera Bag",
  "Carry-On",
  "Checked Bag",
  "Duffel Bag",
  "Gym Bag",
  "Kid Backpack",
  "Personal Item",
  "Suitcase",
  "Toiletry Bag",
];

export function BagsOverview() {
  const navigate = useNavigate();
  const [bags, setBags] = useState<BagSummaryDTO[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function fetchData() {
    try {
      const { bags } = await api.get<{ bags: BagSummaryDTO[] }>("/api/bags");
      setBags(bags);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load bags");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  async function handlePresetTap(name: string, existing: BagSummaryDTO | undefined) {
    if (existing) {
      navigate(`/bags/${existing.id}`);
      return;
    }
    if (pending) return;
    setPending(name);
    try {
      const color = BAG_COLOR_PRESETS[PRESET_BAGS.indexOf(name) % BAG_COLOR_PRESETS.length];
      await api.post("/api/bags", { name, color });
      emitRefresh();
      toast.success(`${name} added`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add bag");
    } finally {
      setPending(null);
    }
  }

  if (bags === null) return null;

  const isPreset = (name: string) => PRESET_BAGS.some((p) => p.toLowerCase() === name.toLowerCase());
  const customBags = bags.filter((b) => !isPreset(b.name));

  return (
    <div className="pb-24">
      <PageHeader
        title="Choose Your Bags"
        description="Select the bags you typically travel with. Tap one to see what's packed inside."
      />

      <div className="flex flex-wrap gap-3">
        {PRESET_BAGS.map((name, i) => {
          const existing = bags.find((b) => b.name.toLowerCase() === name.toLowerCase());
          const isPending = pending === name;
          return (
            <motion.button
              key={name}
              type="button"
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              disabled={isPending}
              onClick={() => handlePresetTap(name, existing)}
              className={cn(
                "flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors",
                existing
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50",
              )}
            >
              <span className="font-display">{name}</span>
              {existing && existing.total > 0 && (
                <span className="text-muted-foreground text-xs font-normal">
                  {existing.completed}/{existing.total}
                </span>
              )}
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  existing ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground",
                )}
              >
                {isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : existing ? (
                  <Check className="size-3" />
                ) : (
                  <Plus className="size-3" />
                )}
              </span>
            </motion.button>
          );
        })}

        {customBags.map((bag) => (
          <motion.button
            key={bag.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/bags/${bag.id}`)}
            className="border-primary bg-primary/10 text-foreground flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-medium"
          >
            <span className="font-display">{bag.name}</span>
            {bag.total > 0 && (
              <span className="text-muted-foreground text-xs font-normal">
                {bag.completed}/{bag.total}
              </span>
            )}
            <span className="bg-success text-success-foreground flex size-5 shrink-0 items-center justify-center rounded-full">
              <Check className="size-3" />
            </span>
          </motion.button>
        ))}

        <AddBagDialog
          trigger={
            <button
              type="button"
              className="border-primary text-primary flex items-center gap-2 rounded-full border-2 border-dashed px-4 py-2.5 text-sm font-medium"
            >
              <Plus className="size-4" />
              Add Bag
            </button>
          }
        />
      </div>
    </div>
  );
}
