import { Router } from "express";

import { requireAdmin, requireAuth } from "@/middleware/auth";
import { createReport, listReports, resolveReport, traceAnonymousAuthor } from "@/services/moderationService";
import { blockUser, unblockUser } from "@/services/connectionService";
import { checkRateLimit } from "@/lib/rateLimiter";
import { createReportSchema, resolveReportSchema } from "@/validations/moderation";

export const moderationRouter = Router();

moderationRouter.use(requireAuth);

moderationRouter.post("/reports", async (req, res) => {
  if (!checkRateLimit(`report:${req.user!._id.toString()}`, 10, 60 * 60 * 1000)) {
    res.status(429).json({ error: "Too many reports submitted recently." });
    return;
  }
  const parsed = createReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const report = await createReport(req.user!._id.toString(), parsed.data);
  res.json({ report });
});

moderationRouter.post("/block/:userId", async (req, res) => {
  const result = await blockUser(req.user!._id.toString(), req.params.userId);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

moderationRouter.delete("/block/:userId", async (req, res) => {
  const result = await unblockUser(req.user!._id.toString(), req.params.userId);
  res.json(result);
});

moderationRouter.get("/reports", requireAdmin, async (req, res) => {
  const reports = await listReports(typeof req.query.status === "string" ? req.query.status : undefined);
  res.json({ reports });
});

moderationRouter.patch("/reports/:id", requireAdmin, async (req, res) => {
  const parsed = resolveReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const report = await resolveReport(req.params.id, req.user!._id.toString(), parsed.data.status);
  res.json({ report });
});

moderationRouter.post("/trace/:messageId", requireAdmin, async (req, res) => {
  const result = await traceAnonymousAuthor(req.params.messageId, req.user!._id.toString());
  if (!result.success) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json(result);
});
