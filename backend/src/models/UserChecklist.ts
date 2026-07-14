import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Per-user checklist row. Deliberately thin — for master-linked items (defaultChecklistItemId
 * set), everything except the fields below (title, price, brand, etc.) lives on
 * DefaultChecklistItem and is joined in at read time. Never duplicate master metadata here. */
const UserChecklistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    defaultChecklistItemId: { type: Schema.Types.ObjectId, ref: "DefaultChecklistItem", default: null, index: true },

    checked: { type: Boolean, default: false, index: true },
    quantity: { type: Number, default: 1, min: 1 },
    note: { type: String, default: "", maxlength: 1000 },
    bagId: { type: Schema.Types.ObjectId, ref: "Bag", default: null, index: true },

    /** Only set when defaultChecklistItemId is null (a user-authored item). */
    isCustomItem: { type: Boolean, default: false },
    customName: { type: String, default: null, trim: true, maxlength: 120 },
    customCategory: { type: String, default: null, trim: true, maxlength: 60 },
    customOrder: { type: Number, default: 0 },

    /** Snapshot of the ChecklistTemplate.version this row was generated against, so a future
     * template bump can detect and backfill rows seeded under an older version. */
    metadataVersion: { type: Number, default: 1 },

    /** Soft delete — preserves history for analytics (e.g. "skipped" master items) instead of
     * losing the row outright. */
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

UserChecklistSchema.index({ userId: 1, defaultChecklistItemId: 1 }, { unique: true, sparse: true });
UserChecklistSchema.index({ userId: 1, deleted: 1 });
UserChecklistSchema.index({ defaultChecklistItemId: 1, checked: 1 });

export type UserChecklistDocument = InferSchemaType<typeof UserChecklistSchema>;

export const UserChecklist: Model<UserChecklistDocument> =
  models.UserChecklist || model<UserChecklistDocument>("UserChecklist", UserChecklistSchema);
