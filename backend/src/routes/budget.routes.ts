import { Router } from "express";

import { budgetEntrySchema, budgetEntryUpdateSchema } from "@/validations/budget";
import {
  createBudgetEntry,
  deleteBudgetEntry,
  getBudgetSummary,
  listBudgetEntries,
  updateBudgetEntry,
} from "@/services/budgetService";
import { requireAuth } from "@/middleware/auth";

export const budgetRouter = Router();

budgetRouter.use(requireAuth);

budgetRouter.get("/", async (req, res) => {
  const entries = await listBudgetEntries(req.user!._id.toString());
  res.json({ entries });
});

budgetRouter.get("/summary", async (req, res) => {
  const summary = await getBudgetSummary(req.user!._id.toString());
  res.json({ summary });
});

budgetRouter.post("/", async (req, res) => {
  const parsed = budgetEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const entry = await createBudgetEntry(req.user!._id.toString(), parsed.data);
  res.json({ entry });
});

budgetRouter.patch("/:id", async (req, res) => {
  const parsed = budgetEntryUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const entry = await updateBudgetEntry(req.user!._id.toString(), parsed.data);
  res.json({ entry });
});

budgetRouter.delete("/:id", async (req, res) => {
  await deleteBudgetEntry(req.user!._id.toString(), req.params.id);
  res.json({ success: true });
});
