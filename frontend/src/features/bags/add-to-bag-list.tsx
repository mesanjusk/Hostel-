import { useEffect, useState } from "react";
import { Check, Loader2, Luggage, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { BAG_COLOR_PRESETS } from "@/types";
import type { BagSummaryDTO } from "@/features/bags/bag-dto";

interface AddToBagListProps {
  itemId: string;
  bagId: string | null;
}

/** Inline "Add to Bag" list shown directly inside the item detail popup — every bag is
 * visible up front so assigning an item takes one tap instead of opening a nested popover
 * first. The item stays on the checklist either way; a bag only ever holds a reference
 * (bagId), never a copy of the item. Tapping the bag the item is already in unassigns it. */
export function AddToBagList({ itemId, bagId }: AddToBagListProps) {
  const [bags, setBags] = useState<BagSummaryDTO[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(BAG_COLOR_PRESETS[0]);
  const [creatingBusy, setCreatingBusy] = useState(false);

  useEffect(() => {
    api
      .get<{ bags: BagSummaryDTO[] }>("/api/bags")
      .then((data) => setBags(data.bags))
      .catch(() => setBags([]));
  }, []);

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
      resetCreateForm();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create bag");
    } finally {
      setCreatingBusy(false);
    }
  }

  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs font-semibold">Add to Bag</p>
      {bags === null ? (
        <div className="flex justify-center py-3">
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {bags.length === 0 && !creating && (
            <p className="text-muted-foreground py-1 text-sm">No bags yet.</p>
          )}
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

          {creating ? (
            <div className="mt-1 flex flex-col gap-2 border-t px-0.5 pt-2">
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
              <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="hover:bg-muted text-muted-foreground hover:text-foreground mt-0.5 flex items-center gap-2 rounded-lg border-t px-2 py-1.5 pt-2 text-sm"
            >
              <Plus className="size-4 shrink-0" />
              New bag
            </button>
          )}
        </div>
      )}
    </div>
  );
}
