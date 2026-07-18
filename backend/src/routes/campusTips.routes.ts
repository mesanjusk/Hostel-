import { createAsyncRouter } from "@/lib/asyncRouter";
import { z } from "zod";

import { requireAuth } from "@/middleware/auth";
import { listTips, createTip, updateTip, deleteTip, voteTip } from "@/services/campusTipService";
import { CAMPUS_TIP_CATEGORIES } from "@/types";

export const campusTipsRouter = createAsyncRouter();

campusTipsRouter.use(requireAuth);

const listQuerySchema = z.object({
  city: z.string().trim().min(1).max(80),
  college: z.string().trim().min(1).max(120),
  category: z.enum(CAMPUS_TIP_CATEGORIES).optional(),
});

/** City/college come from the client rather than being re-derived from the caller's profile:
 * the page always posts the campus it's showing, and a contributor's own profile may lag
 * behind (or use the "Other" free-text college). Tips are ordinary user content — the same
 * trust level as community chat — so this isn't a privilege boundary. */
const tipInputSchema = z.object({
  city: z.string().trim().min(1).max(80),
  college: z.string().trim().min(1).max(120),
  category: z.enum(CAMPUS_TIP_CATEGORIES),
  text: z.string().trim().min(1).max(400),
  linkUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
});

const tipUpdateSchema = tipInputSchema
  .pick({ category: true, text: true, linkUrl: true, imageUrl: true })
  .partial();

const voteSchema = z.object({ direction: z.enum(["up", "down", "none"]) });

campusTipsRouter.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid filters" });
    return;
  }
  const { city, college, category } = parsed.data;
  res.json({ tips: await listTips(req.user!._id.toString(), city, college, category) });
});

campusTipsRouter.post("/", async (req, res) => {
  const parsed = tipInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid tip" });
    return;
  }
  const tip = await createTip(req.user!._id.toString(), parsed.data);
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
