import { createAsyncRouter } from "@/lib/asyncRouter";

import { requireAuth } from "@/middleware/auth";
import { listActiveCollegesByCityAndCategory } from "@/services/collegeService";

export const collegesRouter = createAsyncRouter();

collegesRouter.use(requireAuth);

/** Public (any authenticated user) listing, scoped to a city + college category — powers the
 * onboarding and profile-edit college select, best-NIRF-rank-first. Both params are required;
 * without them there's nothing to scope the shortlist to, so it returns empty rather than every
 * college in the catalog. */
collegesRouter.get("/", async (req, res) => {
  const city = typeof req.query.city === "string" ? req.query.city : undefined;
  const collegeCategoryId = typeof req.query.collegeCategoryId === "string" ? req.query.collegeCategoryId : undefined;
  if (!city || !collegeCategoryId) {
    res.json({ colleges: [] });
    return;
  }
  res.json({ colleges: await listActiveCollegesByCityAndCategory(city, collegeCategoryId) });
});
