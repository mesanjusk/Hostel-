import { connectDB } from "@/db";
import { Place } from "@/models/Place";
import { User } from "@/models/User";
import { escapeRegex } from "@/lib/regex";
import type { PlaceCategory } from "@/types";
import type { PlaceInput, PlaceUpdateInput } from "@/validations/admin";

/** `city` is required for the public "Places to Explore" listing but optional for admin
 * management, where seeing every place across every city is the point. */
export async function listPlaces(city?: string, category?: PlaceCategory, search?: string) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (city) filter.city = new RegExp(`^${city}$`, "i");
  if (category) filter.category = category;
  if (search) filter.name = new RegExp(escapeRegex(search), "i");

  return Place.find(filter).sort({ featured: -1, rating: -1 }).lean();
}

export async function getPlaceById(id: string) {
  await connectDB();
  return Place.findById(id).lean();
}

export async function createPlace(input: PlaceInput) {
  await connectDB();
  return Place.create(input);
}

export async function updatePlace(input: PlaceUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return Place.findByIdAndUpdate(id, rest, { returnDocument: "after" }).lean();
}

export async function deletePlace(id: string) {
  await connectDB();
  return Place.deleteOne({ _id: id });
}

export async function toggleFavoritePlace(userId: string, placeId: string, favorite: boolean) {
  await connectDB();
  const update = favorite ? { $addToSet: { favoritePlaceIds: placeId } } : { $pull: { favoritePlaceIds: placeId } };
  await User.findByIdAndUpdate(userId, update);
  return { success: true as const };
}

export async function listFavoritePlaces(userId: string) {
  await connectDB();
  const user = await User.findById(userId).select("favoritePlaceIds").lean();
  if (!user?.favoritePlaceIds?.length) return [];
  return Place.find({ _id: { $in: user.favoritePlaceIds } }).lean();
}
