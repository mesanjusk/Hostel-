import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { SuitcaseIcon } from "@/features/bags/suitcase-icon";
import { BAG_COLOR_PRESETS } from "@/types";

interface AddBagDialogProps {
  trigger?: React.ReactNode;
  /** Controlled open state — pass both to open this dialog from somewhere other than its
   * own trigger (e.g. a "New bag" item inside a dropdown menu, which unmounts before a
   * click handler could otherwise open anything). Omit both to keep the default
   * trigger-driven, self-managed behavior. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called with the newly created bag instead of showing the default "ready" toast —
   * lets a caller (like the checklist item's "Add to Bag" menu) assign it somewhere right
   * after creation and show its own, more specific feedback. */
  onCreated?: (bag: { id: string; name: string; color: string }) => void;
}

/** Suggestions only — tapping one just fills the name input (and picks a matching color)
 * so it's still fully editable; nothing here is pre-selected. */
const SUGGESTED_BAG_TYPES = [
  { emoji: "🎒", label: "College Backpack", color: BAG_COLOR_PRESETS[0] },
  { emoji: "🧳", label: "Suitcase", color: BAG_COLOR_PRESETS[1] },
  { emoji: "👜", label: "Tote Bag", color: BAG_COLOR_PRESETS[2] },
  { emoji: "🧼", label: "Toiletry Bag", color: BAG_COLOR_PRESETS[3] },
];

/** "+ Add Bag": a friendly, user-driven create flow. Suggested bag types are shown as
 * tappable chips that just fill in the name field — nothing is pre-picked, everything
 * stays editable, so the bag that gets created is always the one the user named. */
export function AddBagDialog({ trigger, open: controlledOpen, onOpenChange: setControlledOpen, onCreated }: AddBagDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(BAG_COLOR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setName("");
    setColor(BAG_COLOR_PRESETS[0]);
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give your bag a name");
      return;
    }
    setIsSubmitting(true);
    try {
      const { bag } = await api.post<{ bag: { id: string; name: string; color: string } }>("/api/bags", {
        name: trimmed,
        color,
      });
      emitRefresh();
      if (onCreated) {
        onCreated(bag);
      } else {
        toast.success("Your bag is ready 🎒");
      }
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add bag");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      {(trigger !== undefined || !isControlled) && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm">
              <Plus className="size-4" />
              Add Bag
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create a new bag 🎒</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <SuitcaseIcon color={color} interactive={false} size={96} />

          <div className="w-full space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Suggestions
            </Label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_BAG_TYPES.map((suggestion) => {
                const isActive = name.trim().toLowerCase() === suggestion.label.toLowerCase();
                return (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => {
                      setName(suggestion.label);
                      setColor(suggestion.color);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <span aria-hidden>{suggestion.emoji}</span>
                    {suggestion.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="bag-name">Bag name</Label>
            <Input
              id="bag-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your bag"
              className="rounded-xl"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="w-full space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {BAG_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Color ${preset}`}
                  onClick={() => setColor(preset)}
                  className={`size-7 rounded-full border-2 transition-transform ${
                    color === preset ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: preset }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Custom color"
                className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full rounded-full sm:w-auto">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Create Bag ✨
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
