import { Router } from "express";

import { getLandingDesign } from "@/services/landingDesignService";

export const landingRouter = Router();

// Public — the home screen is shown to signed-out visitors, so this must not require auth.
landingRouter.get("/design", async (_req, res) => {
  const design = await getLandingDesign();
  res.json(design);
});
