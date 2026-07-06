import { Router } from "express";

import {
  createCategorySchema,
  deleteCategorySchema,
  renameCategorySchema,
} from "@/validations/category";
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from "@/services/categoryService";
import { requireAuth } from "@/middleware/auth";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get("/", async (req, res) => {
  const categories = await listCategories(req.user!._id.toString());
  res.json({
    categories: categories.map((c) => ({ id: String(c._id), name: c.name, icon: c.icon ?? null })),
  });
});

categoriesRouter.post("/", async (req, res) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await createCategory(req.user!._id.toString(), parsed.data.name, parsed.data.icon);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

categoriesRouter.patch("/:id", async (req, res) => {
  const parsed = renameCategorySchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await renameCategory(
    req.user!._id.toString(),
    parsed.data.id,
    parsed.data.name,
    parsed.data.icon,
  );
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

categoriesRouter.delete("/:id", async (req, res) => {
  const parsed = deleteCategorySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await deleteCategory(req.user!._id.toString(), req.params.id, parsed.data.moveItemsTo);
  if (!result.success) {
    if (result.error === "MOVE_REQUIRED") {
      res.status(409).json({
        error: "This category still has items",
        moveRequired: true,
        itemCount: result.itemCount,
      });
      return;
    }
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});
