import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const DocumentItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    url: { type: String, required: true },
    category: { type: String, default: "General", trim: true, maxlength: 60 },
  },
  { timestamps: true },
);

export type DocumentItemDocument = InferSchemaType<typeof DocumentItemSchema>;

export const DocumentItem: Model<DocumentItemDocument> =
  models.DocumentItem || model<DocumentItemDocument>("DocumentItem", DocumentItemSchema);
