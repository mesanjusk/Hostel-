import { useEffect, useState } from "react";

import { SectionCanvas } from "@/features/canvas/section-canvas";
import { GUIDE_SECTIONS } from "@/features/guide/guide-sections";
import { GUIDE_TOPICS as NAV_SECTIONS } from "@/features/guide/guide-topics";
import { useGuideDesign } from "@/features/guide/use-guide-elements";
import { useMediaQuery } from "@/lib/use-media-query";

export function SurvivalGuideView() {
  const { elements, sectionBackgrounds, loading } = useGuideDesign();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  // Renders only the active breakpoint's tree instead of mounting both and hiding one with
  // CSS — every image element shares the same `src` across breakpoints (only position/scale
  // differ), so mounting both used to fetch every image on the page twice on first load.
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const breakpoint = isDesktop ? "desktop" : "mobile";

  // Scroll-spy: highlight whichever section's top is currently nearest the sticky nav,
  // not just whichever was last clicked.
  useEffect(() => {
    const sections = NAV_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        setActiveSection(topMost.target.id);
      },
      // Counts a section "active" once it's scrolled to just below the sticky nav, until
      // it's mostly scrolled past — accounts for the nav's own height.
      { rootMargin: "-120px 0px -65% 0px", threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  if (loading) {
    // Plain backdrop instead of the hardcoded defaults — avoids a flash of stale copy before
    // the admin's real saved design (fetched above) swaps in a moment later.
    return <div className="fixed inset-0 bg-[#fdf6ee]" />;
  }

  const [heroSection, ...restSections] = GUIDE_SECTIONS;

  return (
    <div className="relative -m-4 bg-[#fdf6ee] text-[#3a2e2a] lg:-m-8">
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" />

      {/* HERO */}
      <section id={heroSection.id} className="relative">
        <SectionCanvas
          section={heroSection}
          sectionIdx={0}
          elements={elements}
          breakpoint={breakpoint}
          background={sectionBackgrounds[heroSection.id]}
          context="guide"
        />
      </section>

      {/* STICKY SECTION NAV */}
      <nav className="sticky top-0 z-20 border-y border-[#e9ddc9] bg-[#fdf6ee] shadow-[0_2px_10px_rgba(58,46,42,0.08)]">
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto px-5 py-3 sm:justify-center sm:px-8">
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeSection === s.id
                  ? "border-[#3a2e2a] bg-[#3a2e2a] text-white"
                  : "border-[#e9ddc9] bg-white/70 text-[#6b5c50] hover:border-[#3a2e2a]/40"
              }`}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {restSections.map((section, i) => {
        const idx = i + 1;
        return (
          <section key={section.id} id={section.id} className="relative scroll-mt-32">
            <SectionCanvas
              section={section}
              sectionIdx={idx}
              elements={elements}
              breakpoint={breakpoint}
              background={sectionBackgrounds[section.id]}
              context="guide"
            />
          </section>
        );
      })}
    </div>
  );
}
