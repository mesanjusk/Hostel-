export interface WishlistItemDTO {
  id: string;
  item: string;
  price: number | null;
  store: string | null;
  url: string | null;
  purchased: boolean;
}

/** Raw shape returned by the API (Mongo doc with `_id`). */
export interface WishlistItemRaw {
  _id: string;
  item: string;
  price?: number | null;
  store?: string | null;
  url?: string | null;
  purchased: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toWishlistItemDTO(raw: WishlistItemRaw): WishlistItemDTO {
  return {
    id: raw._id,
    item: raw.item,
    price: raw.price ?? null,
    store: raw.store ?? null,
    url: raw.url ?? null,
    purchased: raw.purchased,
  };
}
