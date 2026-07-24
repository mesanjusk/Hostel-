import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { BrandName } from "@/components/shared/brand-name";
import { Highlight } from "@/components/shared/scrapbook-pieces";
import { Button } from "@/components/ui/button";
import { useLandingPageSettings } from "@/lib/landing-page-settings";

// One highlighter hue for the "college move-in" phrase; the handwritten headline recolors from
// the app's own brand tokens (--primary/--secondary/--accent) rather than a separate identity.
const HIGHLIGHT_COLOR = "#FDE68A";

const FEATURE_TAGS = ["Packing Lists", "Budgeting", "Shopping", "Roommates"];

/** Logo slot at the top of the screen — shown only once an admin has uploaded a real image
 * (Admin > Landing Page settings). Nothing renders here until then. Wrapped in a link only
 * when the admin has also set a redirect URL. */
function LandingLogo({ logoUrl, redirectUrl }: { logoUrl: string | null; redirectUrl: string | null }) {
  if (!logoUrl) return null;

  const content = (
    <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl">
      <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
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
  const landingSettings = useLandingPageSettings();

  return (
    // Sits on AuthLayout's shared pastel gradient (the app's own --auth-bg-* backdrop) — no white
    // override, no card. Content is phone-screen width even on desktop. Gender is no longer picked
    // here; a single "Get started" CTA moves the visitor into the flow, and the visual theme is an
    // optional choice offered later (onboarding + Settings), decoupled from who the user is.
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto flex w-full max-w-sm flex-col items-center px-6 py-10 text-center"
    >
      <LandingLogo logoUrl={landingSettings?.logoUrl ?? null} redirectUrl={landingSettings?.logoRedirectUrl ?? null} />

      <h1 className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
        <BrandName className="text-4xl sm:text-5xl" />
      </h1>

      <p className="text-muted-foreground mx-auto mt-4 max-w-[22rem] text-base leading-relaxed">
        Everything you need for your{" "}
        <Highlight color={HIGHLIGHT_COLOR} className="text-foreground whitespace-nowrap">
          college move-in
        </Highlight>
        .
      </p>

      <div className="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[11px] font-medium sm:text-xs">
        {FEATURE_TAGS.map((tag, i) => (
          <span key={tag} className="flex items-center gap-1.5 whitespace-nowrap">
            {tag}
            {i < FEATURE_TAGS.length - 1 && <span className="text-primary">&bull;</span>}
          </span>
        ))}
      </div>

      {/* Handwritten headline — recolored from the indigo trio to the app's own brand tokens. */}
      <p
        className="mt-6 flex flex-wrap items-center justify-center gap-x-2 text-2xl sm:text-3xl"
        style={{ fontFamily: "var(--font-caveat-home)" }}
      >
        <span className="text-primary font-bold">Plan smart.</span>
        <span className="text-secondary font-bold">Move easy.</span>
        <span className="text-accent font-bold">Start fresh.</span>
      </p>

      <p className="mt-2 text-xs text-zinc-400 italic">(Created by IIT Bombay &amp; Seniors)</p>

      <Button
        type="button"
        size="lg"
        onClick={() => navigate("/wa-login")}
        className="mt-8 h-[54px] w-full rounded-2xl text-base"
      >
        Get started
        <ArrowRight className="size-5" strokeWidth={2.5} />
      </Button>
    </motion.div>
  );
}
