import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CollegeCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 80, unique: true },
    icon: { type: String, default: null },
    description: { type: String, default: "", maxlength: 500 },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CollegeCategorySchema.index({ active: 1, sortOrder: 1 });

export type CollegeCategoryDocument = InferSchemaType<typeof CollegeCategorySchema>;

export const CollegeCategory: Model<CollegeCategoryDocument> =
  models.CollegeCategory || model<CollegeCategoryDocument>("CollegeCategory", CollegeCategorySchema);
