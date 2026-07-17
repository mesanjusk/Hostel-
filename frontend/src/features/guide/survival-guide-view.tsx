import { useEffect, useState } from "react";

import { SectionCanvas } from "@/features/canvas/section-canvas";
import { SlideContainer } from "@/components/shared/slide-container";
import { useMediaQuery } from "@/lib/use-media-query";
import { GUIDE_SECTIONS } from "@/features/guide/guide-sections";
import { GUIDE_TOPICS as NAV_SECTIONS } from "@/features/guide/guide-topics";
import { useGuideDesign } from "@/features/guide/use-guide-elements";
import type { CanvasElement, HomeSectionDef } from "@/features/welcome/canvas-types";

function GuideSection({
  section,
  sectionIdx,
  elements,
  background,
}: {
  section: HomeSectionDef;
  sectionIdx: number;
  elements: CanvasElement[];
  background: string | undefined;
}) {
  return (
    <div className="relative">
      <div className="block sm:hidden">
        <SectionCanvas section={section} sectionIdx={sectionIdx} elements={elements} breakpoint="mobile" background={background} />
      </div>
      <div className="hidden sm:block">
        <SectionCanvas section={section} sectionIdx={sectionIdx} elements={elements} breakpoint="desktop" background={background} />
      </div>
    </div>
  );
}

function GuideNavPills({ activeSection, onSelect, className }: { activeSection: string; onSelect: (id: string) => void; className: string }) {
  return (
    <nav className={className}>
      <div className="scrollbar-none flex gap-1.5 overflow-x-auto px-5 py-3 sm:justify-center sm:px-8">
        {NAV_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={() => onSelect(s.id)}
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
  );
}

/** Below the `lg` breakpoint this is a normal scrolling scrapbook page (unchanged). At `lg`+
 * it's a locked, one-section-at-a-time slideshow via `SlideContainer` — same "hard slide"
 * mechanism as the Welcome page's MoodboardView (wheel/keyboard advances one slide, dot rail
 * on the right) — rather than a long desktop scroll. */
export function SurvivalGuideView() {
  const { elements, sectionBackgrounds, loading } = useGuideDesign();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [activeSection, setActiveSection] = useState<string>(GUIDE_SECTIONS[0].id);

  // Scroll-spy only applies to mobile's normal document scroll. On desktop, SlideContainer
  // itself drives `activeSection` — only the current slide is ever mounted, so there's
  // nothing left in the DOM to intersection-observe.
  useEffect(() => {
    if (isDesktop) return;
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
  }, [loading, isDesktop]);

  if (loading) {
    // Plain backdrop instead of the hardcoded defaults — avoids a flash of stale copy before
    // the admin's real saved design (fetched above) swaps in a moment later.
    return <div className="fixed inset-0 bg-[#fdf6ee]" />;
  }

  if (isDesktop) {
    return (
      <div className="relative bg-[#fdf6ee] text-[#3a2e2a]">
        <div className="grain-overlay pointer-events-none fixed inset-0 z-0" />
        <GuideNavPills
          activeSection={activeSection}
          onSelect={setActiveSection}
          className="fixed top-0 right-0 left-0 z-20 border-b border-[#e9ddc9] bg-[#fdf6ee] shadow-[0_2px_10px_rgba(58,46,42,0.08)]"
        />
        <SlideContainer activeId={activeSection} onActiveChange={setActiveSection}>
          {GUIDE_SECTIONS.map((section, idx) => (
            // pt-16 keeps the fixed nav bar above from permanently overlapping each slide's
            // artwork — the gap it opens up is plain page background (bg-[#fdf6ee]), which
            // matches every section's canvas backdrop closely enough to read as intentional.
            <div key={section.id} id={section.id} className="pt-16">
              <GuideSection section={section} sectionIdx={idx} elements={elements} background={sectionBackgrounds[section.id]} />
            </div>
          ))}
        </SlideContainer>
      </div>
    );
  }

  const [heroSection, ...restSections] = GUIDE_SECTIONS;

  return (
    <div className="relative -m-4 bg-[#fdf6ee] text-[#3a2e2a] lg:-m-8">
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" />

      {/* HERO */}
      <section id={heroSection.id} className="relative">
        <GuideSection section={heroSection} sectionIdx={0} elements={elements} background={sectionBackgrounds[heroSection.id]} />
      </section>

      <GuideNavPills
        activeSection={activeSection}
        onSelect={setActiveSection}
        className="sticky top-0 z-20 border-y border-[#e9ddc9] bg-[#fdf6ee] shadow-[0_2px_10px_rgba(58,46,42,0.08)]"
      />

      {restSections.map((section, i) => {
        const idx = i + 1;
        return (
          <section key={section.id} id={section.id} className="relative scroll-mt-32">
            <GuideSection section={section} sectionIdx={idx} elements={elements} background={sectionBackgrounds[section.id]} />
          </section>
        );
      })}
    </div>
  );
}
