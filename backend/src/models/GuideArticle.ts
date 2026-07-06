import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { GUIDE_CATEGORIES } from "@/types";

const GuideArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, enum: GUIDE_CATEGORIES, required: true, index: true },
    icon: { type: String, default: "BookOpen" },
    summary: { type: String, default: "", maxlength: 300 },
    content: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type GuideArticleDocument = InferSchemaType<typeof GuideArticleSchema>;

export const GuideArticle: Model<GuideArticleDocument> =
  models.GuideArticle || model<GuideArticleDocument>("GuideArticle", GuideArticleSchema);
