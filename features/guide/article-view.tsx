"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getGuideIcon } from "@/lib/guide-icons";
import { ArticleContent } from "@/features/guide/article-content";
import type { GuideArticleDTO } from "@/features/guide/guide-dto";

export function ArticleView({ article }: { article: GuideArticleDTO }) {
  const Icon = getGuideIcon(article.icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl"
    >
      <Link
        href="/guide"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to guide
      </Link>

      <Card className="gap-4 p-6">
        <div className="flex items-center gap-3">
          <div className="gradient-brand flex size-11 items-center justify-center rounded-xl">
            <Icon className="size-5 text-white" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{article.category}</p>
            <h1 className="font-display text-xl font-bold">{article.title}</h1>
          </div>
        </div>
        <ArticleContent content={article.content} />
      </Card>
    </motion.div>
  );
}
