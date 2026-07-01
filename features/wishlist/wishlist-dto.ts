export interface WishlistItemDTO {
  id: string;
  item: string;
  price: number | null;
  store: string | null;
  url: string | null;
  purchased: boolean;
}
