import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { CHECKLIST_GENDER_OPTIONS, CHECKLIST_PRIORITIES, STORE_OPTIONS } from "@/types";

/** Master data for the packing checklist — admin-managed, shared across every user whose
 * UserChecklist references it. Never mutated per-user; see UserChecklist for the thin
 * per-user overlay (checked/quantity/note/bag) that references this by id. */
const DefaultChecklistItemSchema = new Schema(
  {
    templateId: { type: Schema.Types.ObjectId, ref: "ChecklistTemplate", required: true, index: true },
    category: { type: String, required: true, trim: true, maxlength: 60, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 500 },
    image: { type: String, default: null },
    priority: { type: String, enum: CHECKLIST_PRIORITIES, default: "medium" },
    importance: { type: String, default: "", maxlength: 200 },
    estimatedPrice: { type: Number, default: null, min: 0 },
    recommendedBrand: { type: String, default: null, trim: true },
    recommendedStore: { type: String, enum: [...STORE_OPTIONS, null], default: null },
    purchaseLink: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },

    /** "All" means unisex/applies to everyone; a specific gender targets students whose
     * profile gender matches (see findApplicableItems). */
    gender: { type: String, enum: CHECKLIST_GENDER_OPTIONS, default: "All", index: true },

    /** Empty array + isForAllCollegeCategories=true means "every category". A non-empty
     * array only applies when isForAllCollegeCategories is false. */
    applicableCollegeCategories: { type: [{ type: Schema.Types.ObjectId, ref: "CollegeCategory" }], default: [] },
    applicableCourses: { type: [{ type: Schema.Types.ObjectId, ref: "Course" }], default: [] },
    isForAllCollegeCategories: { type: Boolean, default: true },
    isForAllCourses: { type: Boolean, default: true },

    active: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

DefaultChecklistItemSchema.index({ templateId: 1, active: 1 });
DefaultChecklistItemSchema.index({ templateId: 1, category: 1 });
DefaultChecklistItemSchema.index({ title: "text", category: "text" });

export type DefaultChecklistItemDocument = InferSchemaType<typeof DefaultChecklistItemSchema>;

export const DefaultChecklistItem: Model<DefaultChecklistItemDocument> =
  models.DefaultChecklistItem ||
  model<DefaultChecklistItemDocument>("DefaultChecklistItem", DefaultChecklistItemSchema);
