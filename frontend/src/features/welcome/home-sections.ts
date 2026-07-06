import type { HomeSectionDef } from "@/features/welcome/canvas-types";

export const HOME_SECTIONS: HomeSectionDef[] = [
  {
    id: "hero",
    label: "Hero",
    canvas: { mobile: { width: 400, height: 620 }, desktop: { width: 1400, height: 760 } },
    background:
      "radial-gradient(circle at 25% 20%, #ffd6e8 0%, transparent 45%), radial-gradient(circle at 75% 15%, #cfeaff 0%, transparent 45%), radial-gradient(circle at 50% 85%, #e3d9ff 0%, transparent 50%), #fdf6ee",
  },
  {
    id: "mental-prep",
    label: "Mental Prep",
    canvas: { mobile: { width: 400, height: 780 }, desktop: { width: 1400, height: 620 } },
    background: "#fdf6ee",
  },
  {
    id: "room-setup",
    label: "Room Setup",
    canvas: { mobile: { width: 400, height: 560 }, desktop: { width: 1400, height: 520 } },
    background: "#fdf6ee",
  },
  {
    id: "survival-hacks",
    label: "Survival Hacks",
    canvas: { mobile: { width: 400, height: 660 }, desktop: { width: 1400, height: 580 } },
    background: "#fdf6ee",
  },
  {
    id: "bathroom-reality",
    label: "Bathroom Reality",
    canvas: { mobile: { width: 400, height: 520 }, desktop: { width: 1400, height: 480 } },
    background: "#fdf6ee",
  },
  {
    id: "food-survival",
    label: "Food Survival",
    canvas: { mobile: { width: 400, height: 660 }, desktop: { width: 1400, height: 540 } },
    background: "#fdf6ee",
  },
  {
    id: "roommate-vibes",
    label: "Roommate Vibes",
    canvas: { mobile: { width: 400, height: 560 }, desktop: { width: 1400, height: 440 } },
    background: "#fdf6ee",
  },
  {
    id: "underrated-essentials",
    label: "Underrated Essentials",
    canvas: { mobile: { width: 400, height: 460 }, desktop: { width: 1400, height: 380 } },
    background: "#fdf6ee",
  },
  {
    id: "final",
    label: "Final",
    canvas: { mobile: { width: 400, height: 620 }, desktop: { width: 1400, height: 760 } },
    background: "linear-gradient(180deg, #d9c8ff 0%, #b8ddff 45%, #ffc2dd 100%)",
  },
];

export function sectionIndex(id: string): number {
  return HOME_SECTIONS.findIndex((s) => s.id === id);
}
