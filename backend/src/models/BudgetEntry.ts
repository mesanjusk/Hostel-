import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { BUDGET_CATEGORIES, BUDGET_ENTRY_TYPES } from "@/types";

const BudgetEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: BUDGET_CATEGORIES, required: true },
    type: { type: String, enum: BUDGET_ENTRY_TYPES, default: "expense", index: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

BudgetEntrySchema.index({ userId: 1, date: -1 });

export type BudgetEntryDocument = InferSchemaType<typeof BudgetEntrySchema>;

export const BudgetEntry: Model<BudgetEntryDocument> =
  models.BudgetEntry || model<BudgetEntryDocument>("BudgetEntry", BudgetEntrySchema);
