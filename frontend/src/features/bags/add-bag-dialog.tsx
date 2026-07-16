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
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { SuitcaseIcon } from "@/features/bags/suitcase-icon";
import { BAG_COLOR_PRESETS } from "@/types";

interface AddBagDialogProps {
  trigger?: React.ReactNode;
}

/** "+ Add Bag": name + color picker (preset swatches or a custom pick), with a live 3D
 * preview so you see the suitcase you're about to create. */
export function AddBagDialog({ trigger }: AddBagDialogProps) {
  const [open, setOpen] = useState(false);
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
      await api.post("/api/bags", { name: trimmed, color });
      emitRefresh();
      toast.success("Bag added");
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
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add Bag
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New bag</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <SuitcaseIcon color={color} interactive={false} size={120} />

          <div className="w-full space-y-2">
            <Label htmlFor="bag-name">Bag name</Label>
            <Input
              id="bag-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Suitcase 1, Safari, Blue Bag"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="w-full space-y-2">
            <Label>Color</Label>
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Add bag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
