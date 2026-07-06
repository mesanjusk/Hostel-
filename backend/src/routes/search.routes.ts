import { Router } from "express";

import { globalSearch } from "@/services/searchService";
import { requireAuth } from "@/middleware/auth";

export const searchRouter = Router();

searchRouter.get("/", requireAuth, async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const results = await globalSearch(req.user!._id.toString(), query);
  res.json({ results });
});
