import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ChecklistTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    version: { type: Number, required: true, min: 1 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    published: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

ChecklistTemplateSchema.index({ active: 1, published: 1, version: -1 });
ChecklistTemplateSchema.index({ name: 1, version: 1 }, { unique: true });

export type ChecklistTemplateDocument = InferSchemaType<typeof ChecklistTemplateSchema>;
export const ChecklistTemplate: Model<ChecklistTemplateDocument> =
  models.ChecklistTemplate || model<ChecklistTemplateDocument>("ChecklistTemplate", ChecklistTemplateSchema);
