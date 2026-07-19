import { connectDB } from "@/db";
import { Place } from "@/models/Place";
import { User } from "@/models/User";
import { escapeRegex } from "@/lib/regex";
import { resolveCityAlias } from "@/lib/cityAliases";
import type { PlaceCategory } from "@/types";
import type { PlaceInput, PlaceUpdateInput } from "@/validations/admin";

/** `city` is required for the public "Places to Explore" listing but optional for admin
 * management, where seeing every place across every city is the point.
 *
 * `imagesFirst` (Explore only, not the admin list — that one wants stable ordering while
 * editing) sorts places with a photo ahead of the (often majority, for auto-fetched cities —
 * see placeAutoFetchService.ts) places without one. Implemented as a plain sort key rather than
 * a computed field: MongoDB's BSON type order ranks strings ahead of null, so descending on
 * `imageUrl` puts every place with a photo (a URL string) before every place without one (null),
 * with no aggregation pipeline needed. Verified against real seeded data before relying on it. */
export async function listPlaces(city?: string, category?: PlaceCategory, search?: string, imagesFirst = false) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  // A district-style destination city (e.g. "Ahmedabad, Gujarat") resolves to the plain name
  // (e.g. "Ahmedabad") the curated/auto-fetched Place data is actually keyed on — see
  // cityAliases.ts.
  if (city) filter.city = new RegExp(`^${escapeRegex(resolveCityAlias(city))}$`, "i");
  if (category) filter.category = category;
  if (search) filter.name = new RegExp(escapeRegex(search), "i");

  const sort: Record<string, 1 | -1> = { featured: -1 };
  if (imagesFirst) sort.imageUrl = -1;
  sort.rating = -1;

  return Place.find(filter).sort(sort).lean();
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
