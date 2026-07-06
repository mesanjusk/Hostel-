import type { GuideCategory } from "@/types";

export interface GuideArticleSummaryDTO {
  id: string;
  title: string;
  slug: string;
  category: GuideCategory;
  icon: string;
  summary: string;
}

export interface GuideArticleDTO extends GuideArticleSummaryDTO {
  content: string;
}

export interface GuideArticleRaw {
  _id: string;
  title: string;
  slug: string;
  category: GuideCategory;
  icon: string;
  summary: string;
  content: string;
}

export function toGuideArticleSummaryDTO(raw: GuideArticleRaw): GuideArticleSummaryDTO {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    category: raw.category,
    icon: raw.icon,
    summary: raw.summary,
  };
}

export function toGuideArticleDTO(raw: GuideArticleRaw): GuideArticleDTO {
  return { ...toGuideArticleSummaryDTO(raw), content: raw.content };
}
