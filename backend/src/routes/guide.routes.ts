import { Router } from "express";

import { getGuideArticleBySlug, listGuideArticles } from "@/services/guideService";

export const guideRouter = Router();

guideRouter.get("/", async (_req, res) => {
  const articles = await listGuideArticles();
  res.json({ articles });
});

guideRouter.get("/:slug", async (req, res) => {
  const article = await getGuideArticleBySlug(req.params.slug);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json({ article });
});
