import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Luggage } from "lucide-react";
import { toast } from "sonner";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";

interface AddToBagPopoverProps {
  itemId: string;
  bagId: string | null;
  bagName: string | null;
  bagColor: string | null;
}

/** Quick "Add to Bag" action from a checklist row — a fast, non-blocking way to assign an
 * item to a suitcase without opening the full edit form. The item stays on the checklist
 * either way; a bag only ever holds a reference (bagId), never a copy of the item.
 * Selecting the bag the item is already in unassigns it (one bag per item, toggled).
 *
 * The trigger itself doubles as the assignment indicator: unassigned items show a plain
 * outline suitcase + "Add to Bag" label, assigned items show the suitcase filled solid
 * with that bag's color, a matching tinted background, and the bag's name — so the state
 * is readable at a glance without opening the popover. */
export function AddToBagPopover({ itemId, bagId, bagName, bagColor }: AddToBagPopoverProps) {
  const [open, setOpen] = useState(false);
  const [bags, setBags] = useState<BagSummaryDTO[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBags(null);
    api
      .get<{ bags: BagSummaryDTO[] }>("/api/bags")
      .then((data) => setBags(data.bags))
      .catch(() => setBags([]));
  }, [open]);

  async function handleSelect(bag: BagSummaryDTO) {
    const alreadyAssigned = bagId === bag.id;
    setPendingId(bag.id);
    try {
      await api.patch(`/api/checklist/${itemId}`, { bagId: alreadyAssigned ? null : bag.id });
      emitRefresh();
      toast.success(alreadyAssigned ? `Removed from ${bag.name}` : `Added to ${bag.name}`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update bag");
    } finally {
      setPendingId(null);
    }
  }

  const isAssigned = Boolean(bagId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          key={bagId ?? "none"}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          aria-label={isAssigned ? `Packed in ${bagName}` : "Add to bag"}
          title={isAssigned ? `Packed in ${bagName}` : "Add to bag"}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap transition-colors",
            isAssigned
              ? "border-transparent"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
          style={
            isAssigned && bagColor
              ? { backgroundColor: `${bagColor}22`, borderColor: `${bagColor}66`, color: bagColor }
              : undefined
          }
        >
          <Luggage className="size-4 shrink-0" fill={isAssigned ? "currentColor" : "none"} />
          {isAssigned ? (
            <span className="max-w-[90px] truncate sm:max-w-[130px]">{bagName}</span>
          ) : (
            <>
              <span className="hidden sm:inline">Add to Bag</span>
              <span className="sm:hidden">Add</span>
            </>
          )}
        </motion.button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <p className="text-muted-foreground px-2 py-1 text-xs font-semibold">Add to Bag</p>
        {bags === null ? (
          <div className="flex justify-center py-3">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        ) : bags.length === 0 ? (
          <p className="text-muted-foreground px-2 py-2 text-sm">
            No bags yet — create one from the Bags tab.
          </p>
        ) : (
          <div className="flex flex-col">
            {bags.map((bag) => {
              const isBagAssigned = bagId === bag.id;
              return (
                <button
                  key={bag.id}
                  type="button"
                  disabled={pendingId !== null}
                  onClick={() => handleSelect(bag)}
                  className={cn(
                    "hover:bg-muted flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm disabled:opacity-60",
                    isBagAssigned && "bg-muted/60",
                  )}
                >
                  <Luggage
                    className="size-4 shrink-0"
                    fill={isBagAssigned ? "currentColor" : "none"}
                    style={{ color: bag.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-left">{bag.name}</span>
                  {pendingId === bag.id ? (
                    <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                  ) : (
                    isBagAssigned && <Check className="text-primary size-4 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
