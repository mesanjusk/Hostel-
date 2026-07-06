import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { CHECKLIST_PRIORITIES, STORE_OPTIONS } from "@/types";

const ChecklistItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true, trim: true, maxlength: 60, index: true },
    item: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 500 },
    imageUrl: { type: String, default: null },
    completed: { type: Boolean, default: false, index: true },
    priority: { type: String, enum: CHECKLIST_PRIORITIES, default: "medium" },
    price: { type: Number, default: null, min: 0 },
    priceRangeMin: { type: Number, default: null, min: 0 },
    priceRangeMax: { type: Number, default: null, min: 0 },
    recommendedBrand: { type: String, default: null, trim: true },
    recommendedStore: { type: String, enum: [...STORE_OPTIONS, null], default: null },
    purchaseLink: { type: String, default: null },
    studentRating: { type: Number, default: null, min: 0, max: 5 },
    importance: { type: String, default: "" },
  },
  { timestamps: true },
);

ChecklistItemSchema.index({ userId: 1, category: 1 });
ChecklistItemSchema.index({ userId: 1, item: "text" });

export type ChecklistItemDocument = InferSchemaType<typeof ChecklistItemSchema>;

export const ChecklistItem: Model<ChecklistItemDocument> =
  models.ChecklistItem || model<ChecklistItemDocument>("ChecklistItem", ChecklistItemSchema);
