import type { HomeSectionDef } from "@/features/welcome/canvas-types";
import { SECTION_BACKGROUND_PRESETS } from "@/features/welcome/section-background-presets";

/** Every section shares one canvas size per breakpoint so they all render at a consistent,
 * predictable size — both in the admin editor and on the live page — instead of each section
 * having its own arbitrary aspect ratio. Mobile matches a modern iPhone's logical screen size
 * (393 x 852 pt, e.g. iPhone 15/16/17), so a "mobile" section is exactly one phone screen;
 * width/height then scale fluidly to any real device via the canvas's CSS aspect-ratio. */
const MOBILE_CANVAS = { width: 393, height: 852 };
const DESKTOP_CANVAS = { width: 1400, height: 760 };

export const HOME_SECTIONS: HomeSectionDef[] = [
  {
    id: "hero",
    label: "Hero",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.sunrise,
  },
  {
    id: "mental-prep",
    label: "Mental Prep",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "room-setup",
    label: "Room Setup",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "survival-hacks",
    label: "Survival Hacks",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "bathroom-reality",
    label: "Bathroom Reality",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "food-survival",
    label: "Food Survival",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "roommate-vibes",
    label: "Roommate Vibes",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "underrated-essentials",
    label: "Underrated Essentials",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.cream,
  },
  {
    id: "final",
    label: "Final",
    canvas: { mobile: MOBILE_CANVAS, desktop: DESKTOP_CANVAS },
    background: SECTION_BACKGROUND_PRESETS.dusk,
  },
];

export function sectionIndex(id: string): number {
  return HOME_SECTIONS.findIndex((s) => s.id === id);
}
