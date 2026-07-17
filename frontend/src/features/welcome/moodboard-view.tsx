import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { HomeSectionCanvas } from "@/features/welcome/home-section-canvas";
import { HOME_SECTIONS } from "@/features/welcome/home-sections";
import { useHomeDesign } from "@/features/welcome/use-home-elements";
import { SlideContainer } from "@/components/shared/slide-container";
import { useMediaQuery } from "@/lib/use-media-query";

export function MoodboardView() {
  const { elements, sectionBackgrounds, loading } = useHomeDesign();
  const [activeSection, setActiveSection] = useState<string>(HOME_SECTIONS[0].id);
  // Renders only the active breakpoint's tree instead of mounting both and hiding one with
  // CSS — every image element shares the same `src` across breakpoints (only position/scale
  // differ), so mounting both used to fetch every image on the page twice on first load.
  // Same fix as SurvivalGuideView.
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const breakpoint = isDesktop ? "desktop" : "mobile";

  if (loading) {
    // Plain backdrop instead of the hardcoded defaults — avoids a flash of stale gradient/copy
    // before the admin's real saved design (fetched above) swaps in a moment later.
    return <div className="fixed inset-0 bg-[#fdf6ee]" />;
  }

  return (
    <div className="relative overflow-x-hidden bg-[#fdf6ee] text-[#3a2e2a]">
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" />

      <SlideContainer activeId={activeSection} onActiveChange={setActiveSection}>
        {HOME_SECTIONS.map((section) => (
          <div key={section.id} id={section.id} className="relative">
            <HomeSectionCanvas
              section={section}
              elements={elements}
              breakpoint={breakpoint}
              background={sectionBackgrounds[section.id]}
            />
          </div>
        ))}
      </SlideContainer>

      {/* Persistent FAB — always reachable while scrolling the board */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed right-5 bottom-5 z-50 sm:right-8 sm:bottom-8"
      >
        <Link
          to="/wa-login"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#3a2e2a] px-6 py-3.5 text-sm font-bold text-white shadow-[4px_6px_16px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5 active:scale-95 sm:px-7 sm:py-4 sm:text-base"
        >
          Open Checklist
        </Link>
      </motion.div>
    </div>
  );
}
