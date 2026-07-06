import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { GuideView } from "@/features/guide/guide-view";
import {
  toGuideArticleSummaryDTO,
  type GuideArticleRaw,
  type GuideArticleSummaryDTO,
} from "@/features/guide/guide-dto";

export default function GuidePage() {
  const [articles, setArticles] = useState<GuideArticleSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ articles: GuideArticleRaw[] }>("/api/guide")
      .then(({ articles }) => setArticles(articles.map(toGuideArticleSummaryDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load guide"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return <GuideView articles={articles} />;
}
