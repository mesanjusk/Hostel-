import { Router } from "express";

import type { ProductCategory } from "@/types";
import { getProductById, listProducts } from "@/services/productService";

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  const category = typeof req.query.category === "string" ? (req.query.category as ProductCategory) : undefined;
  const products = await listProducts(category);
  res.json({ products });
});

productsRouter.get("/:id", async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ product });
});
