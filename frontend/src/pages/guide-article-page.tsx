import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { ArticleView } from "@/features/guide/article-view";
import NotFound from "@/pages/not-found";
import { toGuideArticleDTO, type GuideArticleDTO, type GuideArticleRaw } from "@/features/guide/guide-dto";

export default function GuideArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<GuideArticleDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api
      .get<{ article: GuideArticleRaw }>(`/api/guide/${slug}`)
      .then(({ article }) => setArticle(toGuideArticleDTO(article)))
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          toast.error(error instanceof ApiError ? error.message : "Failed to load article");
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return null;
  if (notFound || !article) return <NotFound />;

  return <ArticleView article={article} />;
}
