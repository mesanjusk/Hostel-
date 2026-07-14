import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ChecklistTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    version: { type: Number, required: true, default: 1 },
    description: { type: String, default: "", maxlength: 500 },
    published: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type ChecklistTemplateDocument = InferSchemaType<typeof ChecklistTemplateSchema>;

export const ChecklistTemplate: Model<ChecklistTemplateDocument> =
  models.ChecklistTemplate || model<ChecklistTemplateDocument>("ChecklistTemplate", ChecklistTemplateSchema);
