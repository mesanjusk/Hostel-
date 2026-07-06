import { connectDB } from "@/db";
import { WishlistItem } from "@/models/WishlistItem";
import type { WishlistItemInput, WishlistItemUpdateInput } from "@/validations/wishlist";

export async function listWishlistItems(userId: string) {
  await connectDB();
  return WishlistItem.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function createWishlistItem(userId: string, input: WishlistItemInput) {
  await connectDB();
  return WishlistItem.create({ userId, ...input });
}

export async function updateWishlistItem(userId: string, input: WishlistItemUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return WishlistItem.findOneAndUpdate({ _id: id, userId }, rest, { returnDocument: "after" }).lean();
}

export async function deleteWishlistItem(userId: string, id: string) {
  await connectDB();
  return WishlistItem.deleteOne({ _id: id, userId });
}
