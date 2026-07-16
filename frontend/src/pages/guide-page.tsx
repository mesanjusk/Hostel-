import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, peekCache } from "@/lib/api";
import { GuideView } from "@/features/guide/guide-view";
import {
  toGuideArticleSummaryDTO,
  type GuideArticleRaw,
  type GuideArticleSummaryDTO,
} from "@/features/guide/guide-dto";

const GUIDE_PATH = "/api/guide";

export default function GuidePage() {
  const cachedGuide = peekCache<{ articles: GuideArticleRaw[] }>(GUIDE_PATH);
  const [articles, setArticles] = useState<GuideArticleSummaryDTO[]>(
    () => cachedGuide?.articles.map(toGuideArticleSummaryDTO) ?? [],
  );
  const [loading, setLoading] = useState(() => !cachedGuide);

  useEffect(() => {
    api
      .get<{ articles: GuideArticleRaw[] }>(GUIDE_PATH)
      .then(({ articles }) => setArticles(articles.map(toGuideArticleSummaryDTO)))
      .catch((error) => toast.error(error instanceof ApiError ? error.message : "Failed to load guide"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return <GuideView articles={articles} />;
}
