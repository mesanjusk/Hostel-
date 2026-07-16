import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const BagSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    color: { type: String, default: "#7C9CF2" },
    imageUrl: { type: String, default: null },
  },
  { timestamps: true },
);

BagSchema.index({ userId: 1, name: 1 }, { unique: true });

export type BagDocument = InferSchemaType<typeof BagSchema>;

export const Bag: Model<BagDocument> = models.Bag || model<BagDocument>("Bag", BagSchema);
