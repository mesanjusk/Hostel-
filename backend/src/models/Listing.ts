import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { LISTING_TYPES } from "@/types";

/** Hostel/PG/Flat listings shown to students on the "Hostel, PG, Flat" browse page — same CMS
 * shape as Place (city/category/content) plus rent/deposit/contact fields borrowed from
 * Booking's stay-specific fields. Admin-managed by default, but any user can also submit one
 * directly from the browse page (same moderation shape as DirectoryContact): `addedByUserId`
 * is null for admin-authored/seeded listings, `verified` defaults false and is only ever set
 * true by an admin action (or automatically for admin-authored listings — see admin.routes.ts). */
const ListingSchema = new Schema(
  {
    type: { type: String, enum: LISTING_TYPES, required: true, index: true },
    city: { type: String, required: true, trim: true, maxlength: 80, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    imageUrl: { type: String, default: null },
    rent: { type: Number, default: null, min: 0 },
    deposit: { type: Number, default: null, min: 0 },
    address: { type: String, default: "", trim: true, maxlength: 300 },
    contactName: { type: String, default: "", trim: true, maxlength: 80 },
    contactPhone: { type: String, default: "", trim: true, maxlength: 20 },
    mapsLink: { type: String, default: null, trim: true, maxlength: 500 },
    description: { type: String, default: "", maxlength: 500 },
    featured: { type: Boolean, default: false },
    addedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ListingSchema.index({ city: 1, type: 1 });

export type ListingDocument = InferSchemaType<typeof ListingSchema>;

export const Listing: Model<ListingDocument> =
  models.Listing || model<ListingDocument>("Listing", ListingSchema);
