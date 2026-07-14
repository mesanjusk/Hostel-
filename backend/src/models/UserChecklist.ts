import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UserChecklistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    defaultChecklistItemId: { type: Schema.Types.ObjectId, ref: "DefaultChecklistItem", default: null, index: true },
    checked: { type: Boolean, default: false, index: true },
    quantity: { type: Number, default: 1, min: 1 },
    note: { type: String, default: "", maxlength: 1000 },
    bagId: { type: Schema.Types.ObjectId, ref: "Bag", default: null, index: true },
    customName: { type: String, default: null, trim: true, maxlength: 120 },
    customCategory: { type: String, default: null, trim: true, maxlength: 60 },
    isCustomItem: { type: Boolean, default: false, index: true },
    customOrder: { type: Number, default: 0, index: true },
    metadataVersion: { type: Number, default: 1 },
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

UserChecklistSchema.index(
  { userId: 1, defaultChecklistItemId: 1 },
  { unique: true, partialFilterExpression: { defaultChecklistItemId: { $type: "objectId" } } },
);
UserChecklistSchema.index({ userId: 1, deleted: 1, checked: 1 });
UserChecklistSchema.index({ userId: 1, isCustomItem: 1, customName: 1 });

export type UserChecklistDocument = InferSchemaType<typeof UserChecklistSchema>;
export const UserChecklist: Model<UserChecklistDocument> =
  models.UserChecklist || model<UserChecklistDocument>("UserChecklist", UserChecklistSchema);
