import type { Metadata } from "next";

import { SurvivalGuideView } from "@/features/guide/survival-guide-view";

export const metadata: Metadata = {
  title: "Hostel Survival Guide — Hostel Essentials",
  description: "Everything no one tells you before move-in day.",
};

export default function SurvivalGuidePage() {
  return <SurvivalGuideView />;
}
