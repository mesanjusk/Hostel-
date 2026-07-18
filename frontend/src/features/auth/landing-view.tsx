import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

import { BrandName } from "@/components/shared/brand-name";
import { writeSelectedGender } from "@/lib/onboarding-gender";
import { cn } from "@/lib/utils";
import type { Gender } from "@/types";

const GENDER_CHOICES = ["Female", "Male"] as const satisfies readonly Gender[];

// Brief pause so the tap's highlight is visible before the route change carries it away.
const NAVIGATE_DELAY_MS = 350;

export function LandingView() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Gender | null>(null);

  function handleSelect(gender: Gender) {
    if (selected) return;
    setSelected(gender);
    writeSelectedGender(gender);
    setTimeout(() => navigate("/wa-login"), NAVIGATE_DELAY_MS);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass w-full max-w-md rounded-3xl p-8 text-center shadow-2xl"
    >
      <img src="/logo.png" alt="" width={64} height={64} className="mx-auto" />

      <h1 className="font-display mt-4 text-2xl font-bold">Hey there!</h1>
      <p className="mt-2 text-sm">
        We're <BrandName />
        <Heart className="text-primary ml-1 inline size-3.5 -translate-y-0.5 fill-current" />
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        Your college move-in bestie — packing lists, budgets and new roomies, all sorted before day one.
      </p>

      <p className="mt-8 mb-3 text-sm font-medium">Who are we setting this up for?</p>
      <div className="flex gap-3">
        {GENDER_CHOICES.map((gender) => (
          <button
            key={gender}
            type="button"
            onClick={() => handleSelect(gender)}
            disabled={selected !== null}
            className={cn(
              "flex-1 rounded-2xl border px-4 py-5 text-base font-semibold transition-all",
              selected === gender
                ? "border-primary bg-primary text-primary-foreground scale-[1.03]"
                : "border-input text-foreground hover:border-primary/50 bg-transparent disabled:opacity-40",
            )}
          >
            {gender}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
