import type { GuideCategory } from "@/types";

export interface AdminGuideArticleDTO {
  id: string;
  title: string;
  slug: string;
  category: GuideCategory;
  icon: string;
  summary: string;
  content: string;
  order: number;
}

export interface AdminGuideArticleRaw {
  _id: string;
  title: string;
  slug: string;
  category: GuideCategory;
  icon: string;
  summary: string;
  content: string;
  order: number;
}

export function toAdminGuideArticleDTO(raw: AdminGuideArticleRaw): AdminGuideArticleDTO {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    category: raw.category,
    icon: raw.icon,
    summary: raw.summary,
    content: raw.content,
    order: raw.order,
  };
}
