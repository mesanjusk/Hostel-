import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Backpack,
  Check,
  ClipboardList,
  Coffee,
  GlassWater,
  Headphones,
  ImageIcon,
  Laptop,
  Luggage,
  NotebookText,
} from "lucide-react";

import { BrandName } from "@/components/shared/brand-name";
import { writeSelectedGender } from "@/lib/onboarding-gender";
import { useLandingPageSettings } from "@/lib/landing-page-settings";
import { cn } from "@/lib/utils";
import type { Gender } from "@/types";

// Premium neutral palette, scoped to this screen only — deliberately not the app's shared
// pink `--primary` (index.css), which stays untouched for every other screen.
const ACCENT = "#4F46E5";

const FEATURE_TAGS = ["Packing Lists", "Budgeting", "Shopping", "Roommates"];

// Extremely subtle grey outline doodles — what's actually in a move-in bag, at ~4-5% opacity so
// they read as texture, not decoration.
const BACKGROUND_DOODLES = [
  { Icon: Backpack, className: "top-4 -left-6 size-16 -rotate-12" },
  { Icon: NotebookText, className: "-top-2 right-2 size-12 rotate-6" },
  { Icon: Coffee, className: "top-1/3 -left-10 size-10 -rotate-6" },
  { Icon: Luggage, className: "top-1/4 -right-10 size-16 rotate-6" },
  { Icon: Headphones, className: "bottom-1/4 -left-8 size-12 rotate-12" },
  { Icon: GlassWater, className: "bottom-8 right-6 size-10 -rotate-6" },
  { Icon: Laptop, className: "-bottom-4 right-1/4 size-14 rotate-3" },
] as const;

interface GenderCardConfig {
  gender: Gender;
  label: string;
  cardBg: string;
  imageUrl: string | null;
}

// Brief pause so the tap's highlight is visible before the route change carries it away.
const NAVIGATE_DELAY_MS = 350;

/** Shown in a card's placeholder area until an admin uploads a real image (Admin > Landing Page
 * settings) — never a hardcoded character illustration, per design brief. */
function ImagePlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/10 bg-white/60">
      <ImageIcon className="size-7 text-zinc-300" strokeWidth={1.5} />
    </div>
  );
}

export function LandingView() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Gender | null>(null);
  const landingSettings = useLandingPageSettings();

  const GENDER_CARDS: GenderCardConfig[] = [
    { gender: "Female", label: "College Girl", cardBg: "#F6F4FF", imageUrl: landingSettings?.girlImageUrl ?? null },
    { gender: "Male", label: "College Boy", cardBg: "#F3F8FF", imageUrl: landingSettings?.boyImageUrl ?? null },
  ];

  function handleSelect(gender: Gender) {
    if (selected) return;
    setSelected(gender);
    writeSelectedGender(gender);
    setTimeout(() => navigate("/wa-login"), NAVIGATE_DELAY_MS);
  }

  return (
    <>
      {/* Off-white backdrop for this screen only — sits above AuthLayout's shared pastel
          gradient (other auth screens keep that untouched) and below everything below. */}
      <div className="fixed inset-0 z-40 bg-[#FAFAFA]" />

      <div className="relative z-50 w-full max-w-md">
        {BACKGROUND_DOODLES.map(({ Icon, className }, i) => (
          <div key={i} className={cn("pointer-events-none absolute text-zinc-900/[0.045]", className)}>
            <Icon className="size-full" strokeWidth={1.25} />
          </div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full rounded-[2rem] border border-black/[0.06] bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-20px_rgba(0,0,0,0.15)]"
        >
          {/* Top visual: a "packing checklist" badge with a completion check */}
          <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-zinc-900 shadow-lg">
              <ClipboardList className="size-11 text-white" strokeWidth={2.2} />
            </div>
            <div className="absolute -right-2 -bottom-2 flex size-9 items-center justify-center rounded-full border-4 border-white bg-zinc-900">
              <Check className="size-4 text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className="flex flex-wrap items-center justify-center gap-1.5">
            <BrandName className="text-4xl sm:text-5xl" />
          </h1>

          <p className="mx-auto mt-3 max-w-[24rem] text-sm leading-relaxed text-zinc-500">
            Everything you need for your{" "}
            <span className="marker-highlight font-semibold whitespace-nowrap text-zinc-900">college move-in</span>.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-zinc-500 sm:text-xs">
            {FEATURE_TAGS.map((tag, i) => (
              <span key={tag} className="flex items-center gap-1.5 whitespace-nowrap">
                {tag}
                {i < FEATURE_TAGS.length - 1 && <span style={{ color: ACCENT }}>&bull;</span>}
              </span>
            ))}
          </div>
          <div className="mx-auto mt-2 w-40 border-b-2" style={{ borderColor: `${ACCENT}33` }} />

          <p className="mt-5 text-sm font-medium text-zinc-700">Plan smart. Move easy. Start fresh.</p>

          <div className="mt-7 flex gap-4">
            {GENDER_CARDS.map(({ gender, label, cardBg, imageUrl }) => {
              const isSelected = selected === gender;
              return (
                <motion.button
                  key={gender}
                  type="button"
                  onClick={() => handleSelect(gender)}
                  disabled={selected !== null}
                  whileTap={selected === null ? { scale: 0.97 } : undefined}
                  animate={isSelected ? { scale: 1.03 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-3 rounded-2xl border p-4 transition-[opacity,box-shadow] duration-200",
                    isSelected ? "shadow-md" : "border-black/[0.06] hover:shadow-sm",
                    selected !== null && !isSelected && "opacity-40",
                  )}
                  style={{ backgroundColor: cardBg, borderColor: isSelected ? ACCENT : undefined }}
                >
                  <div className="h-36 w-full sm:h-40">
                    {imageUrl ? (
                      <img src={imageUrl} alt={label} className="h-full w-full object-contain" />
                    ) : (
                      <ImagePlaceholder />
                    )}
                  </div>
                  <span className="font-display text-sm font-bold text-zinc-900">{label}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: ACCENT }}>
                    Start Packing
                    <ArrowRight className="size-3.5" strokeWidth={2.5} />
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
}
