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
