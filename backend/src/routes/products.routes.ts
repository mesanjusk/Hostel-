import { Router } from "express";
import { z } from "zod";

import { DEFAULT_CHECKLIST_CATEGORIES } from "@/types";
import { getProductById, listProducts } from "@/services/productService";

export const productsRouter = Router();

const productsQuerySchema = z.object({
  category: z.enum(DEFAULT_CHECKLIST_CATEGORIES).optional(),
});

productsRouter.get("/", async (req, res) => {
  const parsed = productsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid filters" });
    return;
  }
  const products = await listProducts(parsed.data.category);
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
