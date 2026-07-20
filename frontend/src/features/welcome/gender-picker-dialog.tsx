import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Gender, UserDTO } from "@/types";

const DISMISSED_KEY = "pwm_gender_prompt_dismissed";
const SHOW_DELAY_MS = 2000;

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Storage full/blocked — worst case the popup just reappears next visit.
  }
}

const GENDER_CARDS: { gender: Gender; label: string; bg: string }[] = [
  { gender: "Female", label: "College Girl", bg: "#F6F4FF" },
  { gender: "Male", label: "College Boy", bg: "#F3F8FF" },
];

/**
 * Shown once, ~2 seconds after landing on the Home sticky-notes board, so it never blocks that
 * first paint. Only appears when gender isn't known yet and the visitor hasn't dismissed it
 * before (see readDismissed/writeDismissed). Picking one calls PATCH /api/auth/gender directly
 * — unlike the old pre-login /welcome pick (lib/onboarding-gender.ts, localStorage only), this
 * fires for a visitor who already has a real account (anonymous or not), so it writes straight
 * to that account's `gender` field and use-gender-theme.ts picks it up reactively.
 */
export function GenderPickerDialog() {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<Gender | null>(null);

  useEffect(() => {
    if (!user || user.gender || readDismissed()) return;
    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.gender]);

  async function handleSelect(gender: Gender) {
    setSaving(gender);
    try {
      const { user: updated } = await api.patch<{ user: UserDTO }>("/api/auth/gender", { gender });
      setUser(updated);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't save that. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) writeDismissed();
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Who's packing?</DialogTitle>
          <DialogDescription>Pick one to personalize your theme — change it anytime from Profile.</DialogDescription>
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
