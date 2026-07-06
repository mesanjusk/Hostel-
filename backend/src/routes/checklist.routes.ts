import { Router } from "express";

import {
  bulkActionSchema,
  bulkCreateItemsSchema,
  checklistItemSchema,
  checklistItemUpdateSchema,
  quickRenameItemSchema,
} from "@/validations/checklist";
import {
  addMissingTemplateItems,
  bulkUpdateItems,
  createChecklistItem,
  createChecklistItems,
  deleteChecklistItem,
  getAllItemsByCategory,
  getCategorySummaries,
  getOverallProgress,
  mergeDuplicateItems,
  renameChecklistItem,
  updateChecklistItem,
} from "@/services/checklistService";
import { requireAuth } from "@/middleware/auth";

export const checklistRouter = Router();

checklistRouter.use(requireAuth);

checklistRouter.get("/", async (req, res) => {
  const grouped = await getAllItemsByCategory(req.user!._id.toString());
  res.json({ categories: grouped });
});

checklistRouter.get("/summary", async (req, res) => {
  const userId = req.user!._id.toString();
  const [categorySummaries, overallProgress] = await Promise.all([
    getCategorySummaries(userId),
    getOverallProgress(userId),
  ]);
  res.json({ categorySummaries, overallProgress });
});

checklistRouter.post("/", async (req, res) => {
  const parsed = checklistItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const item = await createChecklistItem(req.user!._id.toString(), parsed.data);
  res.json({ item });
});

checklistRouter.post("/bulk-create", async (req, res) => {
  const parsed = bulkCreateItemsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { count, skipped } = await createChecklistItems(
    req.user!._id.toString(),
    parsed.data.category,
    parsed.data.names,
    parsed.data.priority,
  );
  res.json({ success: true, count, skipped });
});

checklistRouter.post("/bulk-action", async (req, res) => {
  const parsed = bulkActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  await bulkUpdateItems(req.user!._id.toString(), parsed.data.ids, parsed.data.action);
  res.json({ success: true });
});

checklistRouter.post("/merge-duplicates", async (req, res) => {
  const { mergedCount } = await mergeDuplicateItems(req.user!._id.toString());
  res.json({ success: true, mergedCount });
});

checklistRouter.post("/load-starter", async (req, res) => {
  const { count } = await addMissingTemplateItems(req.user!._id.toString());
  res.json({ success: true, count });
});

checklistRouter.patch("/:id/rename", async (req, res) => {
  const parsed = quickRenameItemSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const item = await renameChecklistItem(req.user!._id.toString(), parsed.data.id, parsed.data.item);
  res.json({ item });
});

checklistRouter.patch("/:id", async (req, res) => {
  const parsed = checklistItemUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const item = await updateChecklistItem(req.user!._id.toString(), parsed.data);
  res.json({ item });
});

checklistRouter.delete("/:id", async (req, res) => {
  await deleteChecklistItem(req.user!._id.toString(), req.params.id);
  res.json({ success: true });
});
