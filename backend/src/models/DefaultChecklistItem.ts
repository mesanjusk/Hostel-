import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { CHECKLIST_PRIORITIES, STORE_OPTIONS } from "@/types";

const DefaultChecklistItemSchema = new Schema(
  {
    templateId: { type: Schema.Types.ObjectId, ref: "ChecklistTemplate", required: true, index: true },
    category: { type: String, required: true, trim: true, maxlength: 60, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    normalizedTitle: { type: String, required: true, trim: true, lowercase: true, index: true },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    image: { type: String, default: null },
    priority: { type: String, enum: CHECKLIST_PRIORITIES, default: "medium", index: true },
    importance: { type: String, default: "", trim: true, maxlength: 200 },
    estimatedPrice: { type: Number, default: null, min: 0 },
    recommendedBrand: { type: String, default: null, trim: true, maxlength: 80 },
    recommendedStore: { type: String, enum: [...STORE_OPTIONS, null], default: null },
    purchaseLink: { type: String, default: null },
    sortOrder: { type: Number, default: 0, index: true },
    applicableCollegeCategories: [{ type: Schema.Types.ObjectId, ref: "CollegeCategory", index: true }],
    applicableCourses: [{ type: Schema.Types.ObjectId, ref: "Course", index: true }],
    isForAllCollegeCategories: { type: Boolean, default: true, index: true },
    isForAllCourses: { type: Boolean, default: true, index: true },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

DefaultChecklistItemSchema.index({ templateId: 1, normalizedTitle: 1 }, { unique: true });
DefaultChecklistItemSchema.index({ templateId: 1, active: 1, sortOrder: 1, category: 1 });
DefaultChecklistItemSchema.index({ title: "text", category: "text", description: "text" });

export type DefaultChecklistItemDocument = InferSchemaType<typeof DefaultChecklistItemSchema>;
export const DefaultChecklistItem: Model<DefaultChecklistItemDocument> =
  models.DefaultChecklistItem || model<DefaultChecklistItemDocument>("DefaultChecklistItem", DefaultChecklistItemSchema);
