import type { Metadata } from "next";

import { listGuideArticles } from "@/services/guideService";
import { toPlain } from "@/lib/serialize";
import { GuideAdminView } from "@/features/admin/guide-admin-view";
import type { AdminGuideArticleDTO } from "@/features/admin/guide-admin-dto";

export const metadata: Metadata = { title: "Guide — Admin" };

export default async function AdminGuidePage() {
  const articles = await listGuideArticles();
  const plain = toPlain(articles);

  const items: AdminGuideArticleDTO[] = plain.map((a) => ({
    id: a._id,
    title: a.title,
    slug: a.slug,
    category: a.category,
    icon: a.icon,
    summary: a.summary,
    content: a.content,
    order: a.order,
  }));

  return <GuideAdminView articles={items} />;
}
