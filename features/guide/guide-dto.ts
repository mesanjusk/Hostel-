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
