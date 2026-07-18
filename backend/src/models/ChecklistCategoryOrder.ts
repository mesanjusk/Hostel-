import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Admin-controlled display order for checklist category names — global, shared by every
 * student's checklist (notebook view, list view, and the /api/categories used to build both).
 * A category with no row here just sorts after every ordered one, in whatever order it was
 * already in (see categoryService.listCategories). */
const ChecklistCategoryOrderSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60, unique: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ChecklistCategoryOrderDocument = InferSchemaType<typeof ChecklistCategoryOrderSchema>;

export const ChecklistCategoryOrder: Model<ChecklistCategoryOrderDocument> =
  models.ChecklistCategoryOrder ||
  model<ChecklistCategoryOrderDocument>("ChecklistCategoryOrder", ChecklistCategoryOrderSchema);
