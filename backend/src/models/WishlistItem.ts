import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const WishlistItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    item: { type: String, required: true, trim: true, maxlength: 120 },
    price: { type: Number, default: null, min: 0 },
    store: { type: String, default: null, trim: true },
    url: { type: String, default: null },
    purchased: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type WishlistItemDocument = InferSchemaType<typeof WishlistItemSchema>;

export const WishlistItem: Model<WishlistItemDocument> =
  models.WishlistItem || model<WishlistItemDocument>("WishlistItem", WishlistItemSchema);
