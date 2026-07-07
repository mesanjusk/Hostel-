import { Router } from "express";

import { getLandingDesign } from "@/services/landingDesignService";

export const landingRouter = Router();

// Public — the home screen is shown to signed-out visitors, so this must not require auth.
// No caching: this changes whenever an admin saves the Home Screen editor, and a stale
// cached copy (browser or intermediary) would make just-saved edits look like they never
// took effect.
landingRouter.get("/design", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const design = await getLandingDesign();
  res.json(design);
});
