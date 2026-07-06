import { z } from "zod";

export const wishlistItemSchema = z.object({
  item: z.string().trim().min(1, "Item name is required").max(120),
  price: z.coerce.number().min(0).optional().nullable(),
  store: z.string().trim().max(80).optional().or(z.literal("")),
  url: z.string().trim().url().optional().or(z.literal("")),
});

export const wishlistItemUpdateSchema = wishlistItemSchema.partial().extend({
  id: z.string().min(1),
  purchased: z.boolean().optional(),
});

export type WishlistItemInput = z.infer<typeof wishlistItemSchema>;
export type WishlistItemUpdateInput = z.infer<typeof wishlistItemUpdateSchema>;
