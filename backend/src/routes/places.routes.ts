import { createAsyncRouter } from "@/lib/asyncRouter";
import { z } from "zod";

import { requireAuth } from "@/middleware/auth";
import { listPlaces, getPlaceById, toggleFavoritePlace, listFavoritePlaces } from "@/services/placeService";
import { PLACE_CATEGORIES } from "@/types";

export const placesRouter = createAsyncRouter();

placesRouter.use(requireAuth);

const placesQuerySchema = z.object({
  city: z.string().trim().min(1).max(80),
  category: z.enum(PLACE_CATEGORIES).optional(),
  search: z.string().trim().max(100).optional(),
});

placesRouter.get("/", async (req, res) => {
  const parsed = placesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid filters" });
    return;
  }
  const places = await listPlaces(parsed.data.city, parsed.data.category, parsed.data.search, true);
  res.json({ places });
});

placesRouter.get("/favorites", async (req, res) => {
  res.json({ places: await listFavoritePlaces(req.user!._id.toString()) });
});

placesRouter.get("/:id", async (req, res) => {
  const place = await getPlaceById(req.params.id);
  if (!place) {
    res.status(404).json({ error: "Place not found" });
    return;
  }
  res.json({ place });
});

placesRouter.post("/:id/favorite", async (req, res) => {
  await toggleFavoritePlace(req.user!._id.toString(), req.params.id, true);
  res.json({ success: true });
});

placesRouter.delete("/:id/favorite", async (req, res) => {
  await toggleFavoritePlace(req.user!._id.toString(), req.params.id, false);
  res.json({ success: true });
});
