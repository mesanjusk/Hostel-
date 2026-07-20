import { createAsyncRouter } from "@/lib/asyncRouter";

import { requireAuth, requireIdentified } from "@/middleware/auth";
import { getMyTravelProfile, upsertMyTravelProfile } from "@/services/travelProfileService";
import { findCoPackers, findRoommates } from "@/services/discoveryService";
import {
  sendConnectionRequest,
  respondToConnectionRequest,
  listIncomingRequests,
  listOutgoingRequests,
  listAcceptedConnections,
  blockUser,
  unblockUser,
  listBlockedUsers,
} from "@/services/connectionService";
import { travelProfileSchema, discoveryQuerySchema, sendConnectionSchema, respondConnectionSchema, blockUserSchema } from "@/validations/discovery";

export const discoveryRouter = createAsyncRouter();

discoveryRouter.use(requireAuth, requireIdentified);

discoveryRouter.get("/profile", async (req, res) => {
  const profile = await getMyTravelProfile(req.user!._id.toString());
  res.json({ profile });
});

discoveryRouter.put("/profile", async (req, res) => {
  const parsed = travelProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const profile = await upsertMyTravelProfile(req.user!._id.toString(), parsed.data);
  res.json({ profile });
});

discoveryRouter.get("/co-packers", async (req, res) => {
  const parsed = discoveryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid filters" });
    return;
  }
  const results = await findCoPackers(req.user!._id.toString(), parsed.data);
  res.json({ results });
});

/** No query filters: roommate matching is driven entirely by the viewer's own travel profile.
 * A stale client still sending the old filter params gets an unfiltered deck rather than a 400
 * — its results are a superset of what it asked for, which beats an error screen. */
discoveryRouter.get("/roommates", async (req, res) => {
  const results = await findRoommates(req.user!._id.toString());
  res.json({ results });
});

discoveryRouter.post("/connections", async (req, res) => {
  const parsed = sendConnectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await sendConnectionRequest(
    req.user!._id.toString(),
    parsed.data.recipientId,
    parsed.data.context,
    parsed.data.message,
  );
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ connection: result.connection });
});

discoveryRouter.patch("/connections/:id", async (req, res) => {
  const parsed = respondConnectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await respondToConnectionRequest(req.user!._id.toString(), req.params.id, parsed.data.status);
  if (!result.success) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json({ connection: result.connection });
});

discoveryRouter.get("/connections/incoming", async (req, res) => {
  res.json({ requests: await listIncomingRequests(req.user!._id.toString()) });
});

discoveryRouter.get("/connections/outgoing", async (req, res) => {
  res.json({ requests: await listOutgoingRequests(req.user!._id.toString()) });
});

discoveryRouter.get("/connections/accepted", async (req, res) => {
  res.json({ connections: await listAcceptedConnections(req.user!._id.toString()) });
});

discoveryRouter.post("/block", async (req, res) => {
  const parsed = blockUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await blockUser(req.user!._id.toString(), parsed.data.userId);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

discoveryRouter.delete("/block/:userId", async (req, res) => {
  await unblockUser(req.user!._id.toString(), req.params.userId);
  res.json({ success: true });
});

discoveryRouter.get("/blocked", async (req, res) => {
  res.json({ blocked: await listBlockedUsers(req.user!._id.toString()) });
});
