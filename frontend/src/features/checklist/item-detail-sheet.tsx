import { ExternalLink, ImageIcon, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

const PRIORITY_BADGE_VARIANT = {
  low: "outline",
  medium: "warning",
  high: "destructive",
} as const;

interface ItemDetailSheetProps {
  item: ChecklistItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDetailSheet({ item, open, onOpenChange }: ItemDetailSheetProps) {
  if (!item) return null;

  const hasPriceRange = item.priceRangeMin != null || item.priceRangeMax != null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{item.item}</SheetTitle>
          {item.description && <SheetDescription>{item.description}</SheetDescription>}
        </SheetHeader>

        <div className="flex flex-col gap-5">
          {item.imageUrl ? (
            <div className="relative h-48 w-full overflow-hidden rounded-xl">
              <img src={item.imageUrl} alt={item.item} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="bg-muted flex h-48 w-full items-center justify-center rounded-xl">
              <ImageIcon className="text-muted-foreground size-10" />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={PRIORITY_BADGE_VARIANT[item.priority]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} priority
            </Badge>
            {item.completed && <Badge variant="success">Packed</Badge>}
          </div>

          {item.importance && (
            <div>
              <p className="mb-1 text-sm font-medium">Why it matters</p>
              <p className="text-muted-foreground text-sm">{item.importance}</p>
            </div>
          )}

          {(item.price != null || hasPriceRange) && (
            <div>
              <p className="mb-1 text-sm font-medium">Price</p>
              <p className="text-muted-foreground text-sm">
                {item.price != null && `₹${item.price}`}
                {item.price != null && hasPriceRange && " · "}
                {hasPriceRange && `₹${item.priceRangeMin ?? 0} - ₹${item.priceRangeMax ?? 0} range`}
              </p>
            </div>
          )}

          {item.recommendedBrand && (
            <div>
              <p className="mb-1 text-sm font-medium">Recommended brand</p>
              <p className="text-muted-foreground text-sm">{item.recommendedBrand}</p>
            </div>
          )}

          {item.studentRating != null && (
            <div>
              <p className="mb-1 text-sm font-medium">Student rating</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < Math.round(item.studentRating ?? 0)
                        ? "size-4 fill-warning text-warning"
                        : "text-muted-foreground size-4"
                    }
                  />
                ))}
                <span className="text-muted-foreground ml-1 text-sm">
                  {item.studentRating.toFixed(1)} / 5
                </span>
              </div>
            </div>
          )}

          {(item.recommendedStore || item.purchaseLink) && (
            <>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-medium">Where to buy</p>
                {item.recommendedStore && item.purchaseLink ? (
                  <Button asChild className="w-full">
                    <a href={item.purchaseLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                      Buy on {item.recommendedStore}
                    </a>
                  </Button>
                ) : item.purchaseLink ? (
                  <Button asChild className="w-full">
                    <a href={item.purchaseLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                      View purchase link
                    </a>
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-sm">{item.recommendedStore}</p>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
