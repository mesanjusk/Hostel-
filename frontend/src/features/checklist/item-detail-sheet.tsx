import { ExternalLink, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AddToBagList } from "@/features/bags/add-to-bag-list";
import { cn } from "@/lib/utils";
import type { ChecklistPlanType } from "@/types";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

const PRIORITY_BADGE_VARIANT = {
  low: "outline",
  medium: "warning",
  high: "destructive",
} as const;

const PLAN_TYPE_LABEL: Record<ChecklistPlanType, string> = {
  pack: "Pack it",
  plan: "Plan it",
};

interface ItemDetailSheetProps {
  item: ChecklistItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onPlanTypeChange: (item: ChecklistItemDTO, planType: ChecklistPlanType | null) => void;
}

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
  onDelete,
  onPlanTypeChange,
}: ItemDetailSheetProps) {
  if (!item) return null;

  const hasPriceRange = item.priceRangeMin != null || item.priceRangeMax != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item.item}</DialogTitle>
          {item.description && <DialogDescription>{item.description}</DialogDescription>}
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={PRIORITY_BADGE_VARIANT[item.priority]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} priority
            </Badge>
            {item.completed && <Badge variant="success">Packed</Badge>}
          </div>

          <div className="flex items-center gap-2">
            {(["pack", "plan"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onPlanTypeChange(item, item.planType === type ? null : type)}
                className={cn(
                  "flex-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  item.planType === type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {PLAN_TYPE_LABEL[type]}
              </button>
            ))}
          </div>

          {item.notes && (
            <div>
              <p className="mb-1 text-sm font-medium">Notes</p>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

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
          )}

          <Separator />

          <AddToBagList itemId={item.id} bagId={item.bagId} />

          <ConfirmDialog
            trigger={
              <Button variant="destructive" className="w-full">
                Delete item
              </Button>
            }
            title="Delete this item?"
            description="This can't be undone."
            onConfirm={() => {
              onOpenChange(false);
              onDelete(item.id);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
