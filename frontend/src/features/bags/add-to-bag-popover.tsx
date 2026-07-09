import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Luggage, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { BAG_COLOR_PRESETS } from "@/types";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";

interface AddToBagPopoverProps {
  itemId: string;
  bagId: string | null;
  bagName: string | null;
  bagColor: string | null;
}

/** Picks readable text/icon color against a given fill color, so the solid "assigned"
 * badge stays legible no matter which bag color (preset or custom) it's showing. */
function getContrastText(hex: string | null): string {
  if (!hex) return "#1f2937";
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#1f2937";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1f2937" : "#ffffff";
}

/** Quick "Add to Bag" action from a checklist row — a fast, non-blocking way to assign an
 * item to a suitcase without opening the full edit form. The item stays on the checklist
 * either way; a bag only ever holds a reference (bagId), never a copy of the item.
 * Selecting the bag the item is already in unassigns it (one bag per item, toggled).
 *
 * The trigger itself doubles as the assignment indicator: unassigned items show a plain
 * outline suitcase + "Add to Bag" label, assigned items show a bold solid badge — filled
 * with that bag's color, contrast-safe text, and the bag's name — so the state is
 * unmistakable at a glance without opening the popover. */
export function AddToBagPopover({ itemId, bagId, bagName, bagColor }: AddToBagPopoverProps) {
  const [open, setOpen] = useState(false);
  const [bags, setBags] = useState<BagSummaryDTO[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(BAG_COLOR_PRESETS[0]);
  const [creatingBusy, setCreatingBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBags(null);
    api
      .get<{ bags: BagSummaryDTO[] }>("/api/bags")
      .then((data) => setBags(data.bags))
      .catch(() => setBags([]));
  }, [open]);

  function resetCreateForm() {
    setCreating(false);
    setNewName("");
    setNewColor(BAG_COLOR_PRESETS[0]);
  }

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

  async function handleCreateAndAssign() {
    const name = newName.trim();
    if (!name) {
      toast.error("Give your bag a name");
      return;
    }
    setCreatingBusy(true);
    try {
      const { bag } = await api.post<{ bag: { id: string; name: string; color: string } }>(
        "/api/bags",
        { name, color: newColor },
      );
      await api.patch(`/api/checklist/${itemId}`, { bagId: bag.id });
      emitRefresh();
      toast.success(`Added to ${bag.name}`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create bag");
    } finally {
      setCreatingBusy(false);
    }
  }

  const isAssigned = Boolean(bagId);
  const assignedTextColor = getContrastText(bagColor);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetCreateForm();
      }}
    >
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
            "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap shadow-sm transition-colors",
            isAssigned
              ? "border-transparent"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
          style={
            isAssigned && bagColor
              ? { backgroundColor: bagColor, color: assignedTextColor }
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
      <PopoverContent align="end" className="w-64 p-2">
        {creating ? (
          <div className="flex flex-col gap-2 p-1">
            <p className="text-muted-foreground px-1 text-xs font-semibold">New bag</p>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Cabin Bag"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateAndAssign();
                }
              }}
            />
            <div className="flex flex-wrap items-center gap-1.5 px-0.5">
              {BAG_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Color ${preset}`}
                  onClick={() => setNewColor(preset)}
                  className={cn(
                    "size-6 rounded-full border-2 transition-transform",
                    newColor === preset ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: preset }}
                />
              ))}
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                aria-label="Custom color"
                className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Button size="sm" className="flex-1" onClick={handleCreateAndAssign} disabled={creatingBusy}>
                {creatingBusy && <Loader2 className="size-4 animate-spin" />}
                Create &amp; add
              </Button>
              <Button size="sm" variant="ghost" onClick={resetCreateForm}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground px-2 py-1 text-xs font-semibold">Add to Bag</p>
            {bags === null ? (
              <div className="flex justify-center py-3">
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
              </div>
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
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="hover:bg-muted text-muted-foreground hover:text-foreground mt-0.5 flex items-center gap-2 rounded-lg border-t px-2 py-1.5 pt-2 text-sm"
                >
                  <Plus className="size-4 shrink-0" />
                  New bag
                </button>
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
