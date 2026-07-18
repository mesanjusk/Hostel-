import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ShoppingBag, Check, X, Star, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getProductIcon, getProductIconColorClasses } from "@/lib/product-icons";
import { cn } from "@/lib/utils";
import { DEFAULT_CHECKLIST_CATEGORIES } from "@/types";
import type { ProductDTO } from "@/features/shopping/product-dto";

const STORE_LABELS: Record<keyof ProductDTO["buyLinks"], string> = {
  amazon: "Amazon",
  flipkart: "Flipkart",
  myntra: "Myntra",
  decathlon: "Decathlon",
  local: "Local Store",
};

const MAX_TAGS = 3;

function ProductCard({ product, index }: { product: ProductDTO; index: number }) {
  const Icon = getProductIcon(product.icon);
  const iconColorClasses = getProductIconColorClasses(product.icon);
  const availableStores = (Object.keys(product.buyLinks) as (keyof ProductDTO["buyLinks"])[]).filter(
    (key) => product.buyLinks[key],
  );
  const hasDiscount = product.discountPercent > 0;
  const originalPrice = hasDiscount ? Math.round(product.price / (1 - product.discountPercent / 100)) : null;

  const tags = [
    ...product.pros.map((text) => ({ text, positive: true })),
    ...product.cons.map((text) => ({ text, positive: false })),
  ].slice(0, MAX_TAGS);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="h-full gap-0 overflow-hidden p-0 shadow-md shadow-black/[0.04] transition-shadow hover:shadow-lg">
        <div className={cn("relative flex aspect-square items-center justify-center sm:aspect-video", !product.imageUrl && iconColorClasses)}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Icon className="size-10 opacity-70 sm:size-12" aria-hidden="true" />
          )}

          <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1">
            {product.featured ? (
              <Badge variant="accent" className="glass shadow-sm">
                <Sparkles className="size-3" />
                <span className="hidden sm:inline">Featured</span>
              </Badge>
            ) : (
              <span />
            )}
            {hasDiscount && (
              <Badge variant="destructive" className="glass shadow-sm">
                {product.discountPercent}% off
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col gap-2 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4">
          <div className="min-w-0">
            <p className="text-muted-foreground truncate text-[11px] sm:text-xs">{product.store}</p>
            <h3 className="font-display line-clamp-2 text-sm leading-snug font-semibold sm:text-base">
              {product.name}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-base font-bold sm:text-lg">₹{product.price.toLocaleString("en-IN")}</span>
            {originalPrice != null && (
              <span className="text-muted-foreground text-xs line-through">
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
            )}
            {product.rating > 0 && (
              <span className="ml-auto flex items-center gap-0.5 text-xs font-medium">
                <Star className="fill-warning text-warning size-3.5" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map(({ text, positive }) => (
                <span
                  key={text}
                  className={cn(
                    "flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
                    positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {positive ? <Check className="size-3 shrink-0" /> : <X className="size-3 shrink-0" />}
                  <span className="truncate">{text}</span>
                </span>
              ))}
            </div>
          )}

          {(product.budgetAlternative || product.premiumAlternative) && (
            <div className="border-border/60 flex flex-col gap-1.5 border-t pt-2 text-[11px] sm:text-xs">
              {product.budgetAlternative && (
                <div className="bg-muted flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">Budget · </span>
                    {product.budgetAlternative.name}
                  </span>
                  <span className="shrink-0 font-medium">₹{product.budgetAlternative.price.toLocaleString("en-IN")}</span>
                </div>
              )}
              {product.premiumAlternative && (
                <div className="bg-muted flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">Premium · </span>
                    {product.premiumAlternative.name}
                  </span>
                  <span className="shrink-0 font-medium">₹{product.premiumAlternative.price.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>
          )}

          {availableStores.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {availableStores.map((store) => (
                <Button key={store} asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                  <a href={product.buyLinks[store]!} target="_blank" rel="noopener noreferrer">
                    {STORE_LABELS[store]}
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ShoppingView({ products }: { products: ProductDTO[] }) {
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(
    () => (category === "all" ? products : products.filter((p) => p.category === category)),
    [products, category],
  );

  return (
    <div>
      <PageHeader
        title="Shopping Recommendations"
        description="Curated picks for what to buy before you move in"
        action={
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {DEFAULT_CHECKLIST_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No recommendations yet"
          description="Check back soon — the admin team is curating picks for this category."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
