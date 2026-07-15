import { Router } from "express";

import { requireAuth } from "@/middleware/auth";
import {
  createCustomCommunity,
  discoverCommunities,
  getCommunityBySlug,
  getMembership,
  joinCommunity,
  leaveCommunity,
  listMembers,
  listMyCommunities,
  setMemberModeration,
  updateMemberRole,
} from "@/services/communityService";
import { listChannels, createChannel, archiveChannel } from "@/services/channelService";
import {
  createChannelSchema,
  createCommunitySchema,
  listCommunitiesQuerySchema,
  updateMemberRoleSchema,
} from "@/validations/community";
import { checkRateLimit } from "@/lib/rateLimiter";
import type { CommunityRole } from "@/types";

export const communitiesRouter = Router();

communitiesRouter.use(requireAuth);

communitiesRouter.get("/", async (req, res) => {
  const parsed = listCommunitiesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid query" });
    return;
  }
  const result = await discoverCommunities(req.user!._id.toString(), parsed.data);
  res.json(result);
});

communitiesRouter.get("/mine", async (req, res) => {
  const communities = await listMyCommunities(req.user!._id.toString());
  res.json({ communities });
});

communitiesRouter.post("/", async (req, res) => {
  if (!checkRateLimit(`create-community:${req.user!._id.toString()}`, 5, 60 * 60 * 1000)) {
    res.status(429).json({ error: "Too many communities created recently. Try again later." });
    return;
  }
  const parsed = createCommunitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const community = await createCustomCommunity(req.user!._id.toString(), parsed.data);
  res.json({ community });
});

communitiesRouter.get("/:slug", async (req, res) => {
  const community = await getCommunityBySlug(req.params.slug);
  if (!community) {
    res.status(404).json({ error: "Community not found" });
    return;
  }
  const [membership, channels] = await Promise.all([
    getMembership(req.user!._id.toString(), community._id.toString()),
    listChannels(community._id.toString()),
  ]);
  res.json({ community, myRole: membership?.role ?? null, channels });
});

communitiesRouter.post("/:id/join", async (req, res) => {
  const membership = await joinCommunity(req.user!._id.toString(), req.params.id);
  res.json({ membership });
});

communitiesRouter.post("/:id/leave", async (req, res) => {
  const result = await leaveCommunity(req.user!._id.toString(), req.params.id);
  res.json(result);
});

communitiesRouter.get("/:id/members", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Math.min(Number(req.query.pageSize) || 30, 100);
  const result = await listMembers(req.params.id, page, pageSize);
  res.json(result);
});

communitiesRouter.patch("/:id/members/:userId/role", async (req, res) => {
  const parsed = updateMemberRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const actorMembership = await getMembership(req.user!._id.toString(), req.params.id);
  const result = await updateMemberRole(
    (actorMembership?.role ?? "member") as CommunityRole,
    req.params.id,
    req.params.userId,
    parsed.data.role,
  );
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json({ membership: result.membership });
});

communitiesRouter.patch("/:id/members/:userId/moderation", async (req, res) => {
  const actorMembership = await getMembership(req.user!._id.toString(), req.params.id);
  const result = await setMemberModeration(
    (actorMembership?.role ?? "member") as CommunityRole,
    req.params.id,
    req.params.userId,
    { muted: req.body.muted, banned: req.body.banned },
  );
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json({ membership: result.membership });
});

communitiesRouter.get("/:id/channels", async (req, res) => {
  const channels = await listChannels(req.params.id);
  res.json({ channels });
});

communitiesRouter.post("/:id/channels", async (req, res) => {
  const parsed = createChannelSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const actorMembership = await getMembership(req.user!._id.toString(), req.params.id);
  if (!actorMembership || !["owner", "admin", "moderator"].includes(actorMembership.role)) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const result = await createChannel(req.params.id, parsed.data);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ channel: result.channel });
});

communitiesRouter.delete("/:id/channels/:channelId", async (req, res) => {
  const actorMembership = await getMembership(req.user!._id.toString(), req.params.id);
  if (!actorMembership || !["owner", "admin", "moderator"].includes(actorMembership.role)) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const result = await archiveChannel(req.params.id, req.params.channelId);
  res.json(result);
});
