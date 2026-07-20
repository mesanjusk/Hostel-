import { createAsyncRouter } from "@/lib/asyncRouter";

import { requireAuth, requireIdentified } from "@/middleware/auth";
import {
  canModerate,
  createCustomCommunity,
  discoverCommunities,
  getCommunityBySlug,
  getMembership,
  joinCommunityAsSelf,
  leaveCommunity,
  listMembers,
  listMyCommunities,
  removeMember,
  setMemberModeration,
  updateMemberRole,
} from "@/services/communityService";
import { listChannels, createChannel, archiveChannel } from "@/services/channelService";
import {
  createChannelSchema,
  createCommunitySchema,
  listCommunitiesQuerySchema,
  moderateMemberSchema,
  updateMemberRoleSchema,
} from "@/validations/community";
import { checkRateLimit } from "@/lib/rateLimiter";
import type { CommunityRole } from "@/types";

export const communitiesRouter = createAsyncRouter();

communitiesRouter.use(requireAuth, requireIdentified);

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
  const membership = await getMembership(req.user!._id.toString(), community._id.toString());
  const isSiteAdmin = req.user!.role === "admin";
  // Private/invite-only communities don't leak their existence (channel names, description)
  // to non-members — only a public community, or one you're already a member of, is visible.
  // Same idea for a "pending" (awaiting approval) or "suspended" community: the member who
  // triggered its auto-creation (or was added by an admin) can still reach it, everyone else
  // gets a 404 until a site admin approves it. Site admins can always see through both checks.
  const hiddenStatus = Boolean(community.status && community.status !== "approved");
  if (!isSiteAdmin && !membership && (community.visibility !== "public" || hiddenStatus)) {
    res.status(404).json({ error: "Community not found" });
    return;
  }
  const channels = await listChannels(community._id.toString());
  res.json({ community, myRole: membership?.role ?? null, channels });
});

communitiesRouter.post("/:id/join", async (req, res) => {
  const result = await joinCommunityAsSelf(req.user!._id.toString(), req.params.id);
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json({ membership: result.membership });
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
    req.user!.role === "admin",
  );
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json({ membership: result.membership });
});

communitiesRouter.patch("/:id/members/:userId/moderation", async (req, res) => {
  const parsed = moderateMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const actorMembership = await getMembership(req.user!._id.toString(), req.params.id);
  const result = await setMemberModeration(
    (actorMembership?.role ?? "member") as CommunityRole,
    req.params.id,
    req.params.userId,
    parsed.data,
    req.user!.role === "admin",
  );
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json({ membership: result.membership });
});

communitiesRouter.delete("/:id/members/:userId", async (req, res) => {
  const actorMembership = await getMembership(req.user!._id.toString(), req.params.id);
  const result = await removeMember(
    (actorMembership?.role ?? "member") as CommunityRole,
    req.params.id,
    req.params.userId,
    req.user!.role === "admin",
  );
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }
  res.json({ success: true });
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
  if (!canModerate(actorMembership?.role)) {
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
  if (!canModerate(actorMembership?.role)) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const result = await archiveChannel(req.params.id, req.params.channelId);
  res.json(result);
});
