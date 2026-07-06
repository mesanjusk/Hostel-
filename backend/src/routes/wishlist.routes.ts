import { Router } from "express";

import { wishlistItemSchema, wishlistItemUpdateSchema } from "@/validations/wishlist";
import {
  createWishlistItem,
  deleteWishlistItem,
  listWishlistItems,
  updateWishlistItem,
} from "@/services/wishlistService";
import { requireAuth } from "@/middleware/auth";

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);

wishlistRouter.get("/", async (req, res) => {
  const items = await listWishlistItems(req.user!._id.toString());
  res.json({ items });
});

wishlistRouter.post("/", async (req, res) => {
  const parsed = wishlistItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const item = await createWishlistItem(req.user!._id.toString(), parsed.data);
  res.json({ item });
});

wishlistRouter.patch("/:id", async (req, res) => {
  const parsed = wishlistItemUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const item = await updateWishlistItem(req.user!._id.toString(), parsed.data);
  res.json({ item });
});

wishlistRouter.delete("/:id", async (req, res) => {
  await deleteWishlistItem(req.user!._id.toString(), req.params.id);
  res.json({ success: true });
});
