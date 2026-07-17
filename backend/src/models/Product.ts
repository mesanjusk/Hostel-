import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { DEFAULT_CHECKLIST_CATEGORIES } from "@/types";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    /** Name of a lucide icon (see the frontend's lib/product-icons.ts), shown in place of a
     * photo. This catalog links to store *searches* rather than to specific listings, so
     * there's no one product to picture — an icon per item carries the meaning instead.
     * Unset falls back to a generic shopping-bag icon. */
    icon: { type: String, default: null },
    imageUrl: { type: String, default: null },
    category: { type: String, enum: DEFAULT_CHECKLIST_CATEGORIES, required: true, index: true },
    store: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    rating: { type: Number, default: 4, min: 0, max: 5 },
    pros: { type: [String], default: [] },
    cons: { type: [String], default: [] },
    buyLinks: {
      amazon: { type: String, default: null },
      flipkart: { type: String, default: null },
      myntra: { type: String, default: null },
      decathlon: { type: String, default: null },
      local: { type: String, default: null },
    },
    budgetAlternative: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    premiumAlternative: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type ProductDocument = InferSchemaType<typeof ProductSchema>;

export const Product: Model<ProductDocument> =
  models.Product || model<ProductDocument>("Product", ProductSchema);
