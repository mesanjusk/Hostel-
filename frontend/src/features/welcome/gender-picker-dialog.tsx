import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Gender, UserDTO } from "@/types";

const SHOW_DELAY_MS = 2000;

const GENDER_CARDS: { gender: Gender; label: string; bg: string }[] = [
  { gender: "Female", label: "College Girl", bg: "#F6F4FF" },
  { gender: "Male", label: "College Boy", bg: "#F3F8FF" },
];

/**
 * Shown ~2 seconds after landing on the Home sticky-notes board, so it never blocks that first
 * paint — but once it appears it's mandatory: no close button, and clicking outside or pressing
 * Escape is blocked (same pattern as the one-time Community profile-setup prompt, see
 * community-profile-setup-dialog.tsx), so a visitor can't keep using the app without picking one.
 * There's deliberately no dismiss path — `open` is derived straight from `!user.gender`, so the
 * only way this closes is by actually answering it. Picking one calls PATCH /api/auth/gender
 * directly — unlike the old pre-login /welcome pick (lib/onboarding-gender.ts, localStorage
 * only), this fires for a visitor who already has a real account (anonymous or not), so it
 * writes straight to that account's `gender` field and use-gender-theme.ts picks it up
 * reactively.
 */
export function GenderPickerDialog() {
  const { user, setUser } = useAuth();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState<Gender | null>(null);

  useEffect(() => {
    if (!user || user.gender) return;
    const timer = setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.gender]);

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

  const open = ready && Boolean(user) && !user?.gender;

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-sm"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Who's packing?</DialogTitle>
          <DialogDescription>Pick one to personalize your theme — you can change it later from Profile.</DialogDescription>
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
