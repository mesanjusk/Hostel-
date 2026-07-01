import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getGuideArticleBySlug } from "@/services/guideService";
import { toPlain } from "@/lib/serialize";
import { ArticleView } from "@/features/guide/article-view";
import type { GuideArticleDTO } from "@/features/guide/guide-dto";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getGuideArticleBySlug(slug);
  return { title: article ? `${article.title} — Hostel Essentials` : "Guide — Hostel Essentials" };
}

export default async function GuideArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getGuideArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const plain = toPlain(article);

  const dto: GuideArticleDTO = {
    id: plain._id,
    title: plain.title,
    slug: plain.slug,
    category: plain.category,
    icon: plain.icon,
    summary: plain.summary,
    content: plain.content,
  };

  return <ArticleView article={dto} />;
}
