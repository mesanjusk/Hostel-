import "server-only";

import { connectDB } from "@/lib/db";
import { GuideArticle } from "@/models/GuideArticle";
import type { GuideArticleInput, GuideArticleUpdateInput } from "@/lib/validations/admin";

export async function listGuideArticles() {
  await connectDB();
  return GuideArticle.find().sort({ category: 1, order: 1 }).lean();
}

export async function getGuideArticleBySlug(slug: string) {
  await connectDB();
  return GuideArticle.findOne({ slug }).lean();
}

export async function createGuideArticle(input: GuideArticleInput) {
  await connectDB();
  return GuideArticle.create(input);
}

export async function updateGuideArticle(input: GuideArticleUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return GuideArticle.findByIdAndUpdate(id, rest, { new: true }).lean();
}

export async function deleteGuideArticle(id: string) {
  await connectDB();
  return GuideArticle.deleteOne({ _id: id });
}

export async function countGuideArticles() {
  await connectDB();
  return GuideArticle.countDocuments();
}
