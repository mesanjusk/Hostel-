import { createAsyncRouter } from "@/lib/asyncRouter";

import { createBagSchema, updateBagSchema } from "@/validations/bag";
import {
  createBag,
  deleteBag,
  getBagWithItems,
  listBagsWithCounts,
  updateBag,
} from "@/services/bagService";
import { requireAuth } from "@/middleware/auth";
import { BAG_COLOR_PRESETS } from "@/types";

export const bagRouter = createAsyncRouter();

/** Maps a service-layer error code to its HTTP status — "not found" and "conflict" are
 * distinct from a validation failure and shouldn't all collapse onto 400 (a client/monitoring
 * system needs to tell "fix your input" apart from "the resource doesn't exist" apart from
 * "that name is already taken"). */
function statusForErrorCode(code: string | undefined): number {
  if (code === "NOT_FOUND") return 404;
  if (code === "CONFLICT") return 409;
  return 400;
}

bagRouter.use(requireAuth);

bagRouter.get("/", async (req, res) => {
  const bags = await listBagsWithCounts(req.user!._id.toString());
  res.json({ bags });
});

bagRouter.get("/:id", async (req, res) => {
  const result = await getBagWithItems(req.user!._id.toString(), req.params.id);
  if (!result) {
    res.status(404).json({ error: "Bag not found" });
    return;
  }
  res.json({
    bag: {
      id: String(result.bag._id),
      name: result.bag.name,
      color: result.bag.color ?? BAG_COLOR_PRESETS[0],
    },
    items: result.items,
  });
});

bagRouter.post("/", async (req, res) => {
  const parsed = createBagSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await createBag(req.user!._id.toString(), parsed.data.name, parsed.data.color);
  if (!result.success) {
    res.status(statusForErrorCode(result.code)).json({ error: result.error });
    return;
  }
  res.status(201).json({
    bag: { id: String(result.bag._id), name: result.bag.name, color: result.bag.color },
  });
});

bagRouter.patch("/:id", async (req, res) => {
  const parsed = updateBagSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const result = await updateBag(req.user!._id.toString(), parsed.data.id, {
    name: parsed.data.name,
    color: parsed.data.color,
  });
  if (!result.success) {
    res.status(statusForErrorCode(result.code)).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

bagRouter.delete("/:id", async (req, res) => {
  const result = await deleteBag(req.user!._id.toString(), req.params.id);
  if (!result.success) {
    res.status(statusForErrorCode(result.code)).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});
