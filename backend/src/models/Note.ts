import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const NoteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, default: "", maxlength: 8000 },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NoteSchema.index({ userId: 1, title: "text", content: "text" });

export type NoteDocument = InferSchemaType<typeof NoteSchema>;

export const Note: Model<NoteDocument> = models.Note || model<NoteDocument>("Note", NoteSchema);
