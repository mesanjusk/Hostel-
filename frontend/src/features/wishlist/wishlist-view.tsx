import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Heart, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { WishlistFormDialog } from "@/features/wishlist/wishlist-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh, subscribeRefresh } from "@/lib/refresh-bus";
import {
  toWishlistItemDTO,
  type WishlistItemDTO,
  type WishlistItemRaw,
} from "@/features/wishlist/wishlist-dto";
import { cn } from "@/lib/utils";

function WishlistCard({
  item,
  index,
  onTogglePurchased,
  onDelete,
}: {
  item: WishlistItemDTO;
  index: number;
  onTogglePurchased: (item: WishlistItemDTO) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className={cn("h-full gap-3 p-5", item.purchased && "opacity-60")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <Checkbox
              checked={item.purchased}
              onCheckedChange={() => onTogglePurchased(item)}
              className="mt-0.5"
            />
            <h3
              className={cn(
                "font-display line-clamp-1 font-semibold",
                item.purchased && "text-muted-foreground line-through",
              )}
            >
              {item.item}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <WishlistFormDialog
              item={item}
              trigger={
                <Button variant="ghost" size="icon" className="size-7" aria-label="Edit wishlist item">
                  <Pencil className="size-3.5" />
                </Button>
              }
            />
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon" className="size-7" aria-label="Delete wishlist item">
                  <Trash2 className="size-3.5" />
                </Button>
              }
              title="Delete this item?"
              description="This can't be undone."
              onConfirm={() => onDelete(item.id)}
            />
          </div>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {item.price != null && <span className="font-medium">₹{item.price}</span>}
          {item.store && <span>{item.store}</span>}
        </div>
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="size-3.5" />
              View
            </Button>
          </a>
        )}
      </Card>
    </motion.div>
  );
}

export function WishlistView() {
  const [items, setItems] = useState<WishlistItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const { items: raw } = await api.get<{ items: WishlistItemRaw[] }>("/api/wishlist");
      setItems(raw.map(toWishlistItemDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  async function togglePurchased(item: WishlistItemDTO) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, purchased: !i.purchased } : i)));
    try {
      await api.patch(`/api/wishlist/${item.id}`, { purchased: !item.purchased });
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update item");
      fetchData();
    }
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.delete(`/api/wishlist/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete item");
      fetchData();
    }
  }

  const wanted = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) => i.purchased);

  return (
    <div>
      <PageHeader title="Wishlist" description="Things you'd love to get your hands on" />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the + button below to add gadgets, gear, or anything else you're hoping to buy."
        />
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
              Still want ({wanted.length})
            </h2>
            {wanted.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nothing left on the list — nice!</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wanted.map((item, i) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    index={i}
                    onTogglePurchased={togglePurchased}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {purchased.length > 0 && (
            <div>
              <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                Got it ({purchased.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {purchased.map((item, i) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    index={i}
                    onTogglePurchased={togglePurchased}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
