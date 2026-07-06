import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const EmergencyContactSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    relation: { type: String, required: true, trim: true, maxlength: 60 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
  },
  { timestamps: true },
);

export type EmergencyContactDocument = InferSchemaType<typeof EmergencyContactSchema>;

export const EmergencyContact: Model<EmergencyContactDocument> =
  models.EmergencyContact || model<EmergencyContactDocument>("EmergencyContact", EmergencyContactSchema);
