import { useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Gender, UserDTO } from "@/types";

const GENDER_CARDS: { gender: Gender; label: string; bg: string }[] = [
  { gender: "Female", label: "College Girl", bg: "#F6F4FF" },
  { gender: "Male", label: "College Boy", bg: "#F3F8FF" },
];

/**
 * The one-question gender prompt, shown the first time a visitor opens a page whose content is
 * personalized by gender — the checklist, the survival guide, and find-a-roomie (see
 * RequireGenderRoute, which owns *when* this appears). It's no longer an app-wide up-front step:
 * onboarding and the Home board never ask, so a visitor who only browses the rest of the app is
 * never bothered by it.
 *
 * `open` is controlled by the caller. While open it's mandatory — no close button, and clicking
 * outside or pressing Escape is blocked — but the gate that renders it only guards those few
 * pages, so a visitor who doesn't want to answer can simply navigate elsewhere. Picking one calls
 * PATCH /api/auth/gender directly (works for anonymous and identified accounts alike) and
 * use-color-theme.ts / the gender-personalized content pick it up reactively via setUser.
 */
export function GenderPickerDialog({
  open,
  title = "Who's packing?",
  description = "Pick one to personalize your checklist and suggestions — you can change it later from Profile.",
}: {
  open: boolean;
  title?: string;
  description?: string;
}) {
  const { setUser } = useAuth();
  const [saving, setSaving] = useState<Gender | null>(null);

  async function handleSelect(gender: Gender) {
    setSaving(gender);
    try {
      const { user: updated } = await api.patch<{ user: UserDTO }>("/api/auth/gender", { gender });
      setUser(updated);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't save that. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-sm"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex gap-4">
          {GENDER_CARDS.map(({ gender, label, bg }) => (
            <button
              key={gender}
              type="button"
              disabled={saving !== null}
              onClick={() => handleSelect(gender)}
              style={{ backgroundColor: bg }}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-2xl border border-black/[0.06] p-4 text-center transition hover:shadow-sm disabled:opacity-50",
              )}
            >
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
