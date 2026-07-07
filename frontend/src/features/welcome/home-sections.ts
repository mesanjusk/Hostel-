import type { HomeSectionDef } from "@/features/welcome/canvas-types";
import { SECTION_BACKGROUND_PRESETS } from "@/features/welcome/section-background-presets";

export const HOME_SECTIONS: HomeSectionDef[] = [
  {
    id: "hero",
    label: "Hero",
    canvas: { mobile: { width: 400, height: 620 }, desktop: { width: 1400, height: 760 } },
    background: SECTION_BACKGROUND_PRESETS.sunrise,
  },
  {
    id: "mental-prep",
    label: "Mental Prep",
    canvas: { mobile: { width: 400, height: 780 }, desktop: { width: 1400, height: 620 } },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "room-setup",
    label: "Room Setup",
    canvas: { mobile: { width: 400, height: 560 }, desktop: { width: 1400, height: 520 } },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "survival-hacks",
    label: "Survival Hacks",
    canvas: { mobile: { width: 400, height: 660 }, desktop: { width: 1400, height: 580 } },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "bathroom-reality",
    label: "Bathroom Reality",
    canvas: { mobile: { width: 400, height: 520 }, desktop: { width: 1400, height: 480 } },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "food-survival",
    label: "Food Survival",
    canvas: { mobile: { width: 400, height: 660 }, desktop: { width: 1400, height: 540 } },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "roommate-vibes",
    label: "Roommate Vibes",
    canvas: { mobile: { width: 400, height: 560 }, desktop: { width: 1400, height: 440 } },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "underrated-essentials",
    label: "Underrated Essentials",
    canvas: { mobile: { width: 400, height: 460 }, desktop: { width: 1400, height: 380 } },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "final",
    label: "Final",
    canvas: { mobile: { width: 400, height: 620 }, desktop: { width: 1400, height: 760 } },
    background: SECTION_BACKGROUND_PRESETS.dusk,
  },
];

export function sectionIndex(id: string): number {
  return HOME_SECTIONS.findIndex((s) => s.id === id);
}
