import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ShoppingBag, Check, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product, i) => {
            const Icon = getProductIcon(product.icon);
            const availableStores = (Object.keys(product.buyLinks) as (keyof ProductDTO["buyLinks"])[]).filter(
              (key) => product.buyLinks[key],
            );

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="h-full gap-3 overflow-hidden p-0">
                  {product.imageUrl && (
                    <div className="bg-muted relative flex aspect-video items-center justify-center">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="size-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}

                  <CardContent
                    className={cn("flex flex-1 flex-col gap-3 pb-5", !product.imageUrl && "pt-5")}
                  >
                    <div className="flex items-center gap-3">
                      {!product.imageUrl && (
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-full",
                            getProductIconColorClasses(product.icon),
                          )}
                        >
                          <Icon className="size-5" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground text-xs">{product.store}</p>
                        <h3 className="font-display line-clamp-1 font-semibold">{product.name}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">₹{product.price.toLocaleString("en-IN")}</span>
                    </div>

                    {(product.pros.length > 0 || product.cons.length > 0) && (
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex flex-col gap-1">
                          {product.pros.slice(0, 3).map((pro) => (
                            <span key={pro} className="flex items-start gap-1">
                              <Check className="text-success mt-0.5 size-3 shrink-0" />
                              {pro}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-col gap-1">
                          {product.cons.slice(0, 3).map((con) => (
                            <span key={con} className="flex items-start gap-1">
                              <X className="text-destructive mt-0.5 size-3 shrink-0" />
                              {con}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(product.budgetAlternative || product.premiumAlternative) && (
                      <div className="border-border/60 grid gap-2 border-t pt-3 text-xs sm:grid-cols-2">
                        {product.budgetAlternative && (
                          <div className="bg-muted rounded-lg p-2">
                            <p className="text-muted-foreground">Budget pick</p>
                            <p className="font-medium">{product.budgetAlternative.name}</p>
                            <p>₹{product.budgetAlternative.price.toLocaleString("en-IN")}</p>
                          </div>
                        )}
                        {product.premiumAlternative && (
                          <div className="bg-muted rounded-lg p-2">
                            <p className="text-muted-foreground">Premium pick</p>
                            <p className="font-medium">{product.premiumAlternative.name}</p>
                            <p>₹{product.premiumAlternative.price.toLocaleString("en-IN")}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {availableStores.length > 0 && (
                      <div className="mt-auto flex flex-wrap gap-2 pt-1">
                        {availableStores.map((store) => (
                          <Button key={store} asChild size="sm" variant="outline">
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
          })}
        </div>
      )}
    </div>
  );
}
