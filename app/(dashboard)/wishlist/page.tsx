import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { listWishlistItems } from "@/services/wishlistService";
import { toPlain } from "@/lib/serialize";
import { WishlistView } from "@/features/wishlist/wishlist-view";
import type { WishlistItemDTO } from "@/features/wishlist/wishlist-dto";

export const metadata: Metadata = { title: "Wishlist — Hostel Essentials" };

export default async function WishlistPage() {
  const session = await auth();
  const items = await listWishlistItems(session!.user.id);

  const initialItems: WishlistItemDTO[] = toPlain(items).map((w) => ({
    id: w._id,
    item: w.item,
    price: w.price ?? null,
    store: w.store ?? null,
    url: w.url ?? null,
    purchased: w.purchased,
  }));

  return <WishlistView initialItems={initialItems} />;
}
