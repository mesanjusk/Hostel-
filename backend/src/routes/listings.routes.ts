import { createAsyncRouter } from "@/lib/asyncRouter";
import { z } from "zod";

import { requireAuth } from "@/middleware/auth";
import { createListing, deleteOwnListing, getListingById, listListings } from "@/services/listingService";
import { LISTING_TYPES } from "@/types";

export const listingsRouter = createAsyncRouter();

listingsRouter.use(requireAuth);

const listingsQuerySchema = z.object({
  city: z.string().trim().min(1).max(80),
  type: z.enum(LISTING_TYPES).optional(),
  search: z.string().trim().max(100).optional(),
});

// Public submission schema — same shape as the admin one minus `featured`, which only an admin
// can set (see admin.routes.ts). A student's own submission is unverified until an admin
// reviews it (Listing.verified), same moderation pattern as DirectoryContact.
const createListingSchema = z.object({
  type: z.enum(LISTING_TYPES),
  city: z.string().trim().min(1, "Enter a city").max(80),
  title: z.string().trim().min(1, "Enter a title").max(150),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  rent: z.coerce.number().min(0).optional(),
  deposit: z.coerce.number().min(0).optional(),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  contactName: z.string().trim().max(80).optional().or(z.literal("")),
  contactPhone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  mapsLink: z.string().trim().max(500).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

listingsRouter.get("/", async (req, res) => {
  const parsed = listingsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid filters" });
    return;
  }
  const listings = await listListings(parsed.data.city, parsed.data.type, parsed.data.search);
  res.json({ listings });
});

listingsRouter.post("/", async (req, res) => {
  const parsed = createListingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const listing = await createListing(parsed.data, { addedByUserId: req.user!._id.toString(), verified: false });
  res.json({ listing });
});

listingsRouter.get("/:id", async (req, res) => {
  const listing = await getListingById(req.params.id);
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  res.json({ listing });
});

listingsRouter.delete("/:id", async (req, res) => {
  const result = await deleteOwnListing(req.user!._id.toString(), req.params.id);
  if (result.deletedCount === 0) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  res.json({ success: true });
});
