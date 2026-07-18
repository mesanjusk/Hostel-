import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Backpack, ClipboardList, Gem } from "lucide-react";

import { BrandName } from "@/components/shared/brand-name";
import { writeSelectedGender } from "@/lib/onboarding-gender";
import { cn } from "@/lib/utils";
import type { Gender } from "@/types";

const GENDER_CARDS = [
  {
    gender: "Female" as Gender,
    label: "For Her",
    icon: Gem,
    bg: "from-[#FFD9E8] to-[#FFBFDA]",
    border: "border-[#FF9CCB]",
  },
  {
    gender: "Male" as Gender,
    label: "For Him",
    icon: Backpack,
    bg: "from-[#FFE3C2] to-[#FFD1A3]",
    border: "border-[#F0B36B]",
  },
] as const;

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
      className="glass relative w-full max-w-md overflow-visible rounded-[2rem] p-8 text-center shadow-[0_25px_60px_-20px_var(--shadow-brand)]"
    >
      {/* Top visual: a little "packing checklist" badge with stickers bobbing around it */}
      <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
        <span className="animate-bob absolute -top-4 -left-7 text-2xl" style={{ animationDelay: "0.3s" }}>
          ✨
        </span>
        <span className="animate-wiggle absolute -top-3 -right-8 text-2xl">💖</span>
        <span
          className="animate-bob absolute -right-6 -bottom-3 text-xl"
          style={{ animationDelay: "1.1s" }}
        >
          🌈
        </span>
        <div className="gradient-brand flex h-24 w-24 items-center justify-center rounded-[1.75rem] shadow-lg">
          <ClipboardList className="size-11 text-white drop-shadow-sm" strokeWidth={2.2} />
        </div>
      </div>

      <p className="text-muted-foreground text-sm font-medium">Hey there!</p>
      <h1 className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
        <BrandName className="text-4xl sm:text-5xl" />
        <span className="text-3xl sm:text-4xl">💖</span>
      </h1>
      <p className="text-primary mt-1.5 text-sm font-semibold">Your college move-in bestie</p>
      <p className="text-muted-foreground mx-auto mt-2 max-w-[26rem] text-sm leading-relaxed">
        Packing lists, budgets and new roomies — all sorted before day one.
      </p>

      <p className="text-muted-foreground mt-8 mb-4 text-xs font-medium">Let's make this yours ✨</p>

      <div className="flex gap-4">
        {GENDER_CARDS.map(({ gender, label, icon: Icon, bg, border }) => {
          const isSelected = selected === gender;
          return (
            <motion.button
              key={gender}
              type="button"
              onClick={() => handleSelect(gender)}
              disabled={selected !== null}
              whileTap={selected === null ? { scale: 0.94 } : undefined}
              animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "flex flex-1 flex-col items-center gap-2.5 rounded-[1.5rem] border-2 bg-gradient-to-b px-4 py-6 shadow-md transition-[opacity,box-shadow] duration-200",
                bg,
                isSelected ? cn(border, "shadow-xl") : "border-white/80 hover:shadow-lg",
                selected !== null && !isSelected && "opacity-40",
              )}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-white/70 shadow-inner">
                <Icon className="size-7 text-[#3a2e2a]" strokeWidth={2} />
              </div>
              <span className="font-display text-sm font-bold text-[#3a2e2a]">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
