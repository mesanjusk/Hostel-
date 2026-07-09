import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { HomeSectionCanvas } from "@/features/welcome/home-section-canvas";
import { HOME_SECTIONS } from "@/features/welcome/home-sections";
import { useHomeDesign } from "@/features/welcome/use-home-elements";
import { SlideContainer } from "@/components/shared/slide-container";

export function MoodboardView() {
  const { elements, sectionBackgrounds, loading } = useHomeDesign();
  const [activeSection, setActiveSection] = useState<string>(HOME_SECTIONS[0].id);
  const [isDesktop, setIsDesktop] = useState(false);

  // On desktop, elements are inside the locked slideshow, so an in-page anchor (e.g. the
  // hero card's "Open My Survival Board →" button, linking to #mental-prep) has nothing to
  // natively scroll to — only the active slide is mounted. Intercept clicks on any same-page
  // hash link here and drive the slideshow directly instead. Native anchor behavior is left
  // alone on mobile, which isn't locked.
  function handleContentClick(e: React.MouseEvent) {
    if (!isDesktop) return;
    const anchor = (e.target as HTMLElement).closest("a[href^='#']");
    if (!anchor) return;
    const id = anchor.getAttribute("href")!.slice(1);
    if (!HOME_SECTIONS.some((s) => s.id === id)) return;
    e.preventDefault();
    setActiveSection(id);
  }

  if (loading) {
    // Plain backdrop instead of the hardcoded defaults — avoids a flash of stale gradient/copy
    // before the admin's real saved design (fetched above) swaps in a moment later.
    return <div className="fixed inset-0 bg-[#fdf6ee]" />;
  }

  return (
    <div className="relative overflow-x-hidden bg-[#fdf6ee] text-[#3a2e2a]" onClick={handleContentClick}>
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" />

      <SlideContainer activeId={activeSection} onActiveChange={setActiveSection} onDesktopChange={setIsDesktop}>
        {HOME_SECTIONS.map((section) => (
          <div key={section.id} id={section.id} className="relative">
            <div className="block sm:hidden">
              <HomeSectionCanvas
                section={section}
                elements={elements}
                breakpoint="mobile"
                background={sectionBackgrounds[section.id]}
              />
            </div>
            <div className="hidden sm:block">
              <HomeSectionCanvas
                section={section}
                elements={elements}
                breakpoint="desktop"
                background={sectionBackgrounds[section.id]}
              />
            </div>
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
          to="/login"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#3a2e2a] px-6 py-3.5 text-sm font-bold text-white shadow-[4px_6px_16px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5 active:scale-95 sm:px-7 sm:py-4 sm:text-base"
        >
          Open Checklist
        </Link>
      </motion.div>
    </div>
  );
}
