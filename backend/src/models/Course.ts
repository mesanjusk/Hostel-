import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CourseSchema = new Schema(
  {
    collegeCategoryId: { type: Schema.Types.ObjectId, ref: "CollegeCategory", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, index: true },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);

CourseSchema.index({ collegeCategoryId: 1, slug: 1 }, { unique: true });
CourseSchema.index({ collegeCategoryId: 1, active: 1, sortOrder: 1, name: 1 });

export type CourseDocument = InferSchemaType<typeof CourseSchema>;
export const Course: Model<CourseDocument> = models.Course || model<CourseDocument>("Course", CourseSchema);
