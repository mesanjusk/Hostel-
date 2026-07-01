import "server-only";

import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import type { ChecklistCategory } from "@/types";
import type { ProductInput, ProductUpdateInput } from "@/lib/validations/admin";

export async function listProducts(category?: ChecklistCategory) {
  await connectDB();
  const filter = category ? { category } : {};
  return Product.find(filter).sort({ featured: -1, createdAt: -1 }).lean();
}

export async function getProductById(id: string) {
  await connectDB();
  return Product.findById(id).lean();
}

export async function createProduct(input: ProductInput) {
  await connectDB();
  return Product.create(input);
}

export async function updateProduct(input: ProductUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return Product.findByIdAndUpdate(id, rest, { new: true }).lean();
}

export async function deleteProduct(id: string) {
  await connectDB();
  return Product.deleteOne({ _id: id });
}

export async function countProducts() {
  await connectDB();
  return Product.countDocuments();
}
