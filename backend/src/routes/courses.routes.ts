import { Router } from "express";

import { requireAuth } from "@/middleware/auth";
import { listActiveCoursesByCategory } from "@/services/courseService";

export const coursesRouter = Router();

coursesRouter.use(requireAuth);

/** Public (any authenticated user) listing, scoped to a college category — powers the
 * onboarding and profile-edit course select, which cascades off the category select. */
coursesRouter.get("/", async (req, res) => {
  const collegeCategoryId = typeof req.query.collegeCategoryId === "string" ? req.query.collegeCategoryId : undefined;
  if (!collegeCategoryId) {
    res.json({ courses: [] });
    return;
  }
  res.json({ courses: await listActiveCoursesByCategory(collegeCategoryId) });
});
