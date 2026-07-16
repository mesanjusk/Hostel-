import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { api, ApiError, peekCache } from "@/lib/api";
import { ArticleView } from "@/features/guide/article-view";
import NotFound from "@/pages/not-found";
import { toGuideArticleDTO, type GuideArticleDTO, type GuideArticleRaw } from "@/features/guide/guide-dto";

function articlePath(slug: string | undefined) {
  return `/api/guide/${slug}`;
}

export default function GuideArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const cachedArticle = peekCache<{ article: GuideArticleRaw }>(articlePath(slug));
  const [article, setArticle] = useState<GuideArticleDTO | null>(
    () => (cachedArticle ? toGuideArticleDTO(cachedArticle.article) : null),
  );
  const [loading, setLoading] = useState(() => !cachedArticle);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const cached = peekCache<{ article: GuideArticleRaw }>(articlePath(slug));
    setLoading(!cached);
    setNotFound(false);
    api
      .get<{ article: GuideArticleRaw }>(articlePath(slug))
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
