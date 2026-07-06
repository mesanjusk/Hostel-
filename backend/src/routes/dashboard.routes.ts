import { Router } from "express";

import { getDashboardData } from "@/services/dashboardService";
import { requireAuth } from "@/middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, async (req, res) => {
  const data = await getDashboardData(req.user!._id.toString());
  res.json(data);
});
