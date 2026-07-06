import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    normalizedName: { type: String, required: true },
    icon: { type: String, default: null },
  },
  { timestamps: true },
);

CategorySchema.index({ userId: 1, normalizedName: 1 }, { unique: true });

export type CategoryDocument = InferSchemaType<typeof CategorySchema>;

export const Category: Model<CategoryDocument> =
  models.Category || model<CategoryDocument>("Category", CategorySchema);
