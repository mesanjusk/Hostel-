import { Router } from "express";

import { getDashboardData } from "@/services/dashboardService";
import { getDashboardLayout } from "@/services/uiLayoutService";
import { requireAuth } from "@/middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, async (req, res) => {
  const data = await getDashboardData(req.user!._id.toString());
  res.json(data);
});

// No caching — this changes whenever an admin saves the Dashboard Layout editor.
dashboardRouter.get("/layout", requireAuth, async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const widgets = await getDashboardLayout();
  res.json({ widgets });
});
