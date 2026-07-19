import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ImageIcon } from "lucide-react";

import { BrandName } from "@/components/shared/brand-name";
import { Highlight } from "@/components/shared/scrapbook-pieces";
import { writeSelectedGender } from "@/lib/onboarding-gender";
import { useLandingPageSettings } from "@/lib/landing-page-settings";
import { cn } from "@/lib/utils";
import type { Gender } from "@/types";

// Premium neutral palette, scoped to this screen only — deliberately not the app's shared
// pink `--primary` (index.css), which stays untouched for every other screen.
const ACCENT = "#4F46E5";

// A little rainbow of marker-highlighter colors — odoo.com-style, one hue per handwritten
// phrase instead of one flat brand color for everything.
const HIGHLIGHT_COLORS = ["#FDE68A", "#FBCFE8", "#BBF7D0", "#BFDBFE"];
const HIGHLIGHT_TEXT_COLORS = ["#c96b9a", "#4F46E5", "#22c55e", "#e0956b"];

const FEATURE_TAGS = ["Packing Lists", "Budgeting", "Shopping", "Roommates"];

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

/** Logo slot at the top of the screen — an admin-uploaded image (Admin > Landing Page settings)
 * if one exists, otherwise a plain placeholder square so the spot where a logo belongs is
 * obvious. Wrapped in a link only when the admin has also set a redirect URL. */
function LandingLogo({ logoUrl, redirectUrl }: { logoUrl: string | null; redirectUrl: string | null }) {
  const content = (
    <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-black/10 bg-zinc-50">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
      ) : (
        <ImageIcon className="size-8 text-zinc-300" strokeWidth={1.5} />
      )}
    </div>
  );

  if (!redirectUrl) return content;

  return (
    <a href={redirectUrl} target="_blank" rel="noopener noreferrer" aria-label="Visit site">
      {content}
    </a>
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
      {/* Plain white backdrop for this screen only — sits above AuthLayout's shared pastel
          gradient (other auth screens keep that untouched). No card, no box — the content
          sits directly on the page, phone-screen width even on desktop. */}
      <div className="fixed inset-0 z-40 bg-white" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-50 mx-auto flex w-full max-w-sm flex-col items-center px-6 py-10 text-center"
      >
        <LandingLogo logoUrl={landingSettings?.logoUrl ?? null} redirectUrl={landingSettings?.logoRedirectUrl ?? null} />

        <h1 className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
          <BrandName className="text-4xl sm:text-5xl" />
        </h1>

        <p className="mx-auto mt-4 max-w-[22rem] text-base leading-relaxed text-zinc-600">
          Everything you need for your{" "}
          <Highlight color={HIGHLIGHT_COLORS[0]} className="whitespace-nowrap text-zinc-900">
            college move-in
          </Highlight>
          .
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-zinc-500 sm:text-xs">
          {FEATURE_TAGS.map((tag, i) => (
            <span key={tag} className="flex items-center gap-1.5 whitespace-nowrap">
              {tag}
              {i < FEATURE_TAGS.length - 1 && (
                <span style={{ color: HIGHLIGHT_TEXT_COLORS[i % HIGHLIGHT_TEXT_COLORS.length] }}>&bull;</span>
              )}
            </span>
          ))}
        </div>

        {/* Handwritten, colorful headline in the odoo.com style — each phrase its own accent
            color instead of one flat brand color for the whole line. */}
        <p
          className="mt-6 flex flex-wrap items-center justify-center gap-x-2 text-2xl sm:text-3xl"
          style={{ fontFamily: "var(--font-caveat-home)" }}
        >
          <span className="font-bold text-[#c96b9a]">Plan smart.</span>
          <span className="font-bold text-[#4F46E5]">Move easy.</span>
          <span className="font-bold text-[#e0956b]">Start fresh.</span>
        </p>

        <p className="mt-2 text-xs text-zinc-400 italic">(Created by IIT Bombay &amp; Seniors)</p>

        <div className="mt-8 flex w-full gap-4">
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
    </>
  );
}
