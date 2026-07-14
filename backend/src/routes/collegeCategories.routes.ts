import { Router } from "express";

import { requireAuth } from "@/middleware/auth";
import { listActiveCollegeCategories } from "@/services/collegeCategoryService";

export const collegeCategoriesRouter = Router();

collegeCategoriesRouter.use(requireAuth);

/** Public (any authenticated user) listing — powers the onboarding and profile-edit selects. */
collegeCategoriesRouter.get("/", async (_req, res) => {
  res.json({ collegeCategories: await listActiveCollegeCategories() });
});
