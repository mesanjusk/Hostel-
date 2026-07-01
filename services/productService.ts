import "server-only";
import type { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { Product, type ProductDocument } from "@/models/Product";
import type { ChecklistCategory } from "@/types";
import type { ProductInput, ProductUpdateInput } from "@/lib/validations/admin";

interface PopulatedAlternative {
  _id: Types.ObjectId;
  name: string;
  price: number;
  store: string;
}

export type ProductLeanWithAlternatives = Omit<
  ProductDocument,
  "budgetAlternative" | "premiumAlternative"
> & {
  _id: Types.ObjectId;
  budgetAlternative: PopulatedAlternative | null;
  premiumAlternative: PopulatedAlternative | null;
};

export async function listProducts(category?: ChecklistCategory) {
  await connectDB();
  const filter = category ? { category } : {};
  return Product.find(filter)
    .sort({ featured: -1, createdAt: -1 })
    .populate("budgetAlternative", "name price store")
    .populate("premiumAlternative", "name price store")
    .lean<ProductLeanWithAlternatives[]>();
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
