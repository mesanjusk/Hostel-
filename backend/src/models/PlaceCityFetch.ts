import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** One doc per city the OSM auto-fetch pipeline (placeAutoFetchService.ts) has ever run against
 * — including cities that already had seedPlaces.ts curated data, and cities where a run found
 * nothing new to add. Existence alone is the signal: a city already scanned is never re-scanned
 * on a later profile save, however many (if any) places came out of that scan. Separate from
 * Place itself because "has this city been through the OSM pass" and "does this city have any
 * Place docs" are different questions once curated cities are supplemented too — a curated city
 * has Place docs from day one but hasn't necessarily been OSM-scanned yet. */
const PlaceCityFetchSchema = new Schema(
  {
    city: { type: String, required: true, trim: true, maxlength: 80, unique: true },
    placesAdded: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type PlaceCityFetchDocument = InferSchemaType<typeof PlaceCityFetchSchema>;

export const PlaceCityFetch: Model<PlaceCityFetchDocument> =
  models.PlaceCityFetch || model<PlaceCityFetchDocument>("PlaceCityFetch", PlaceCityFetchSchema);
