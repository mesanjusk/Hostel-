import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getCategorySummaries, getOverallProgress } from "@/services/checklistService";
import { ChecklistOverview } from "@/features/checklist/checklist-overview";

export const metadata: Metadata = { title: "Packing Checklist — Hostel Essentials" };

export default async function ChecklistPage() {
  const session = await auth();
  const [summaries, overall] = await Promise.all([
    getCategorySummaries(session!.user.id),
    getOverallProgress(session!.user.id),
  ]);

  return <ChecklistOverview summaries={summaries} overall={overall} />;
}
