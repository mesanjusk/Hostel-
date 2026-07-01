import type { Metadata } from "next";

import { listGuideArticles } from "@/services/guideService";
import { toPlain } from "@/lib/serialize";
import { GuideView } from "@/features/guide/guide-view";
import type { GuideArticleSummaryDTO } from "@/features/guide/guide-dto";

export const metadata: Metadata = { title: "Hostel Guide — Hostel Essentials" };

export default async function GuidePage() {
  const articles = await listGuideArticles();
  const plain = toPlain(articles);

  const summaries: GuideArticleSummaryDTO[] = plain.map((a) => ({
    id: a._id,
    title: a.title,
    slug: a.slug,
    category: a.category,
    icon: a.icon,
    summary: a.summary,
  }));

  return <GuideView articles={summaries} />;
}
