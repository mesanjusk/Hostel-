import type { Request, Response } from "express";
import { createAsyncRouter } from "@/lib/asyncRouter";
import { z } from "zod";

import { requireAuth } from "@/middleware/auth";
import { listTips, createTip, updateTip, deleteTip, voteTip } from "@/services/campusTipService";
import { CAMPUS_TIP_CATEGORIES } from "@/types";

export const campusTipsRouter = createAsyncRouter();

campusTipsRouter.use(requireAuth);

const listQuerySchema = z.object({
  category: z.enum(CAMPUS_TIP_CATEGORIES).optional(),
});

const tipInputSchema = z.object({
  category: z.enum(CAMPUS_TIP_CATEGORIES),
  text: z.string().trim().min(1).max(400),
  linkUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
});

const tipUpdateSchema = tipInputSchema.pick({ category: true, text: true, linkUrl: true, imageUrl: true }).partial();

const voteSchema = z.object({ direction: z.enum(["up", "down", "none"]) });

/** City/college are always the caller's own profile fields, never client-supplied — the whole
 * point of "Know Your Campus" is that a student only sees and posts to their own campus, and
 * trusting a client-sent city/college would let anyone browse or post to any other college's
 * board just by changing the request. Null when the profile hasn't set both yet, which the
 * route handlers turn into a 400 pointing back at Profile (mirrors the frontend's own gate in
 * know-your-campus-page.tsx). */
function ownCampus(req: Request, res: Response): { city: string; college: string } | null {
  const city = req.user!.city?.trim();
  const college = req.user!.college?.trim();
  if (!city || !college) {
    res.status(400).json({ error: "Set your city and college in your profile first" });
    return null;
  }
  return { city, college };
}

campusTipsRouter.get("/", async (req, res) => {
  const campus = ownCampus(req, res);
  if (!campus) return;
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid filters" });
    return;
  }
  res.json({ tips: await listTips(req.user!._id.toString(), campus.city, campus.college, parsed.data.category) });
});

campusTipsRouter.post("/", async (req, res) => {
  const campus = ownCampus(req, res);
  if (!campus) return;
  const parsed = tipInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid tip" });
    return;
  }
  const tip = await createTip(req.user!._id.toString(), { ...parsed.data, ...campus });
  res.status(201).json({ tip });
});

campusTipsRouter.patch("/:id", async (req, res) => {
  const parsed = tipUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid tip" });
    return;
  }
  const tip = await updateTip(req.user!._id.toString(), req.user!.role === "admin", req.params.id, parsed.data);
  if (!tip) {
    res.status(404).json({ error: "Tip not found" });
    return;
  }
  res.json({ tip });
});

campusTipsRouter.delete("/:id", async (req, res) => {
  const deleted = await deleteTip(req.user!._id.toString(), req.user!.role === "admin", req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Tip not found" });
    return;
  }
  res.json({ success: true });
});

campusTipsRouter.post("/:id/vote", async (req, res) => {
  const parsed = voteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid vote" });
    return;
  }
  const tip = await voteTip(req.user!._id.toString(), req.params.id, parsed.data.direction);
  if (!tip) {
    res.status(404).json({ error: "Tip not found" });
    return;
  }
  res.json({ tip });
});
