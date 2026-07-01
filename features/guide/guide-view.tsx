"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Luggage, ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getGuideIcon } from "@/lib/guide-icons";
import { GUIDE_CATEGORIES } from "@/types";
import type { GuideArticleSummaryDTO } from "@/features/guide/guide-dto";

export function GuideView({ articles }: { articles: GuideArticleSummaryDTO[] }) {
  const grouped = GUIDE_CATEGORIES.map((category) => ({
    category,
    articles: articles.filter((a) => a.category === category),
  })).filter((g) => g.articles.length > 0);

  return (
    <div>
      <PageHeader
        title="Hostel Survival Guide"
        description="Everything a first-timer needs to know before move-in day"
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link href="/guide/survival-guide">
          <Card className="gradient-brand flex-row items-center justify-between gap-4 border-none p-6 text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Luggage className="size-5" />
              </div>
              <div>
                <p className="font-display font-semibold">
                  The Hostel Survival Guide for First-Time Students
                </p>
                <p className="text-sm text-white/80">
                  Move-in day, roommates, money, safety — the full read.
                </p>
              </div>
            </div>
            <ArrowRight className="size-5 shrink-0" />
          </Card>
        </Link>
      </motion.div>

      {articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Guide coming soon"
          description="Check back shortly for packing tips, safety guides, and more."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map((group) => (
            <div key={group.category}>
              <h2 className="font-display mb-3 text-lg font-semibold">{group.category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.articles.map((article, i) => {
                  const Icon = getGuideIcon(article.icon);
                  return (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Link href={`/guide/${article.slug}`}>
                        <Card className="h-full gap-3 p-5 transition-shadow hover:shadow-md">
                          <div className="gradient-brand flex size-10 items-center justify-center rounded-xl">
                            <Icon className="size-5 text-white" />
                          </div>
                          <h3 className="font-display font-semibold">{article.title}</h3>
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            {article.summary}
                          </p>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
