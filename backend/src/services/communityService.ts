import mongoose from "mongoose";

import { connectDB } from "@/db";
import { Community, type CommunityDocument } from "@/models/Community";
import { CommunityMember, type CommunityMemberDocument } from "@/models/CommunityMember";
import { Channel } from "@/models/Channel";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { slugify } from "@/lib/slug";
import type { CommunityRole, CommunityStatus, CommunityType, CommunityVisibility } from "@/types";
import type { HydratedDocument, Types } from "mongoose";

/** Duck-typed against both hydrated and lean User docs — auto-join only ever reads these
 * fields, so it works right after either `.save()` or a lean `findByIdAndUpdate`. */
interface AutoJoinableUser {
  _id: Types.ObjectId | string;
  city?: string | null;
  college?: string | null;
  campus?: string | null;
  courseId?: Types.ObjectId | string | null;
  year?: string | null;
  interests?: string[] | null;
}

const DEFAULT_CHANNELS: Array<{ name: string; type: "text" | "announcement"; isDefault: boolean }> = [
  { name: "Announcements", type: "announcement", isDefault: true },
  { name: "General", type: "text", isDefault: true },
  { name: "Marketplace", type: "text", isDefault: true },
  { name: "Events", type: "text", isDefault: true },
  { name: "Lost & Found", type: "text", isDefault: true },
];

async function createDefaultChannels(communityId: string) {
  await Promise.all(
    DEFAULT_CHANNELS.map((ch, index) =>
      Channel.findOneAndUpdate(
        { communityId, slug: slugify(ch.name) },
        { $setOnInsert: { communityId, name: ch.name, slug: slugify(ch.name), type: ch.type, isDefault: ch.isDefault, order: index } },
        { upsert: true, setDefaultsOnInsert: true },
      ),
    ),
  );
}

/** Finds a community by (type, scopeKey), creating it — with its default channels — if this
 * is the first student ever to need it. Concurrency-safe: relies on the unique
 * {type, scopeKey} index and falls back to a re-fetch on a duplicate-key race instead of
 * erroring, since two students onboarding into the same new college at once is routine. */
export async function ensureCommunity(
  type: CommunityType,
  scopeKey: string,
  name: string,
  options: {
    description?: string;
    icon?: string;
    isOfficial?: boolean;
    visibility?: CommunityVisibility;
    /** Status to create the community with if it doesn't exist yet — has no effect when a
     * matching community already exists (its current status is left untouched). Defaults to
     * "approved"; auto-join uses "pending" for newly-created city/college/campus/course
     * communities so they need a site admin's sign-off before showing up in discovery. */
    status?: CommunityStatus;
  } = {},
): Promise<HydratedDocument<CommunityDocument>> {
  await connectDB();
  const normalizedKey = scopeKey.trim().toLowerCase();
  const existing = await Community.findOne({ type, scopeKey: normalizedKey });
  if (existing) return existing;

  const slug = `${type}-${slugify(name)}`.slice(0, 140);
  try {
    const created = await Community.create({
      name,
      slug,
      type,
      scopeKey: normalizedKey,
      description: options.description ?? "",
      icon: options.icon ?? null,
      isOfficial: options.isOfficial ?? true,
      visibility: options.visibility ?? "public",
      status: options.status ?? "approved",
    });
    await createDefaultChannels(created._id.toString());
    return created;
  } catch (error) {
    // Duplicate key from a concurrent request creating the same community — the other
    // request won the race, just read what it created.
    const raced = await Community.findOne({ type, scopeKey: normalizedKey });
    if (raced) return raced;
    throw error;
  }
}

/** Idempotently adds a membership and bumps the denormalized member count only on first join.
 * Internal-only — callers that already know joining is appropriate (auto-join into a public
 * system community, a creator becoming their own community's owner). Anything reachable from
 * a student's own request must go through `joinCommunityAsSelf` instead, which enforces
 * visibility. */
export async function joinCommunity(userId: string, communityId: string, role: CommunityRole = "member") {
  await connectDB();
  const existing = await CommunityMember.findOne({ communityId, userId });
  if (existing) return existing;

  // Both writes happen atomically — without a transaction, a crash between them (deploy
  // restart, OOM kill) permanently drifts memberCount from the true membership count, and
  // discoverCommunities sorts by memberCount, so drift visibly misranks communities over time.
  const session = await mongoose.startSession();
  try {
    let membership!: HydratedDocument<CommunityMemberDocument>;
    await session.withTransaction(async () => {
      const created = await CommunityMember.create([{ communityId, userId, role, joinedAt: new Date() }], { session });
      membership = created[0];
      await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: 1 } }, { session });
    });
    return membership;
  } finally {
    await session.endSession();
  }
}

/** What the "Join" button actually calls — unlike `joinCommunity`, this enforces that
 * private/invite-only communities can't be self-joined just by knowing their id/slug. There's
 * no invite-token flow yet, so those visibilities can currently only be populated by an
 * owner/admin adding members directly; self-join is limited to "public". */
export async function joinCommunityAsSelf(userId: string, communityId: string) {
  await connectDB();
  const community = await Community.findById(communityId).lean();
  if (!community || !community.active) return { success: false as const, error: "Community not found" };
  if (community.visibility !== "public") {
    return { success: false as const, error: "This community is invite-only" };
  }
  const membership = await joinCommunity(userId, communityId);
  return { success: true as const, membership };
}

export async function leaveCommunity(userId: string, communityId: string) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const removed = await CommunityMember.findOneAndDelete({ communityId, userId }, { session });
      if (removed) {
        await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: -1 } }, { session });
      }
    });
    return { success: true as const };
  } finally {
    await session.endSession();
  }
}

/** Auto-join, run right after onboarding/profile update: joins the student to every
 * community their current profile implies (country, city, college, course, year, plus any
 * interest communities). The fixed global utility communities (General Discussion, Buy &
 * Sell, Events, Lost & Found) are deliberately not auto-joined — they stay discoverable and
 * joinable manually. Purely additive — never removes a membership the student already has
 * (e.g. an interest community they joined manually), and re-running it after a profile edit
 * (new city, new course) just adds the newly-implied ones. */
export async function ensureAutoJoinCommunities(user: AutoJoinableUser) {
  await connectDB();
  const userId = user._id.toString();
  const joins: Array<Promise<unknown>> = [];

  const country = await ensureCommunity("country", "india", "India", { description: "All students across India." });
  joins.push(joinCommunity(userId, country._id.toString()));

  if (user.city) {
    const city = await ensureCommunity("city", user.city, `${user.city} Students`, {
      description: `Students living in or heading to ${user.city}.`,
      status: "pending",
    });
    joins.push(joinCommunity(userId, city._id.toString()));
  }

  if (user.college) {
    const college = await ensureCommunity("college", user.college, user.college, {
      description: `The community for everyone at ${user.college}.`,
      status: "pending",
    });
    joins.push(joinCommunity(userId, college._id.toString()));

    if (user.campus) {
      const campusKey = `${user.college}::${user.campus}`;
      const campus = await ensureCommunity("campus", campusKey, `${user.college} — ${user.campus}`, {
        description: `The ${user.campus} campus community.`,
        status: "pending",
      });
      joins.push(joinCommunity(userId, campus._id.toString()));
    }
  }

  if (user.courseId) {
    const course = await Course.findById(user.courseId).lean();
    if (course) {
      const courseKey = `course:${user.courseId.toString()}`;
      const courseCommunity = await ensureCommunity("course", courseKey, course.name, {
        description: `Everyone studying ${course.name}.`,
        status: "pending",
      });
      joins.push(joinCommunity(userId, courseCommunity._id.toString()));

      if (user.year) {
        const yearKey = `${courseKey}:${user.year}`;
        const yearCommunity = await ensureCommunity("year", yearKey, `${course.name} — Year ${user.year}`, {
          description: `${course.name} students in year ${user.year}.`,
          status: "pending",
        });
        joins.push(joinCommunity(userId, yearCommunity._id.toString()));
      }
    }
  }

  // The global utility communities (General Discussion, Buy & Sell, Events, Lost & Found)
  // are intentionally not auto-joined: they still exist (seeded in
  // ensureGlobalCommunitiesSeeded) and stay discoverable/joinable manually, but new users
  // are no longer added to them by default.

  await Promise.all(
    (user.interests ?? []).map(async (interest) => {
      const key = slugify(interest);
      if (!key) return;
      const community = await ensureCommunity("interest", key, interest, {
        description: `For students into ${interest}.`,
        isOfficial: false,
      });
      joins.push(joinCommunity(userId, community._id.toString()));
    }),
  );

  await Promise.all(joins);
}

/** Called once at server startup (mirrors ensureCitiesSeeded) so a fresh deployment's
 * community discovery page isn't empty before any student has onboarded. */
export async function ensureGlobalCommunitiesSeeded() {
  await connectDB();
  await ensureCommunity("country", "india", "India", { description: "All students across India." });
  await ensureCommunity("general", "global", "General Discussion", { description: "Campus life, chit-chat, anything goes." });
  await ensureCommunity("marketplace", "global", "Buy & Sell", {
    description: "Books, electronics, hostel items — buy, sell, exchange, or give away.",
  });
  await ensureCommunity("events", "global", "Events", { description: "Fests, workshops, hackathons, meetups." });
  await ensureCommunity("lost_found", "global", "Lost & Found", {
    description: "Lost something on campus? Found something? Post it here.",
  });
}

export async function listMyCommunities(userId: string) {
  await connectDB();
  const memberships = await CommunityMember.find({ userId, banned: false }).lean();
  const communityIds = memberships.map((m) => m.communityId);
  const communities = await Community.find({ _id: { $in: communityIds }, active: true }).lean();
  const roleByCommunity = new Map(memberships.map((m) => [m.communityId.toString(), m.role]));
  return communities
    .map((c) => ({ ...c, myRole: roleByCommunity.get(c._id.toString()) ?? "member" }))
    .sort((a, b) => b.memberCount - a.memberCount);
}

export async function discoverCommunities(
  userId: string,
  filters: { q?: string; type?: string; page: number; pageSize: number },
) {
  await connectDB();
  const myMemberships = await CommunityMember.find({ userId }).select("communityId").lean();
  const joinedIds = new Set(myMemberships.map((m) => m.communityId.toString()));

  // `$nin` (rather than `status: "approved"`) so communities created before the `status` field
  // existed — which have no `status` at all — stay visible; only explicitly pending/suspended
  // ones are excluded.
  const query: Record<string, unknown> = { active: true, visibility: "public", status: { $nin: ["pending", "suspended"] } };
  if (filters.type) query.type = filters.type;
  if (filters.q) query.$text = { $search: filters.q };

  // Deliberately not sorting text search hits by $meta textScore: doing that correctly
  // requires projecting `score` alongside every other field (a restrictive projection here
  // would silently strip name/icon/memberCount/etc from the response), and for a "search
  // communities by name" box, most-members-first is a perfectly good ranking anyway.
  const [communities, total] = await Promise.all([
    Community.find(query)
      .sort({ memberCount: -1 })
      .skip((filters.page - 1) * filters.pageSize)
      .limit(filters.pageSize)
      .lean(),
    Community.countDocuments(query),
  ]);

  return {
    communities: communities.map((c) => ({ ...c, joined: joinedIds.has(c._id.toString()) })),
    total,
  };
}

export async function getCommunityBySlug(slug: string) {
  await connectDB();
  return Community.findOne({ slug, active: true }).lean();
}

export async function getMembership(userId: string, communityId: string) {
  await connectDB();
  return CommunityMember.findOne({ userId, communityId });
}

const MODERATOR_ROLES: CommunityRole[] = ["owner", "admin", "moderator"];

export function canModerate(role: CommunityRole | undefined) {
  return Boolean(role && MODERATOR_ROLES.includes(role));
}

export async function createCustomCommunity(
  userId: string,
  input: { name: string; description?: string; icon?: string | null; visibility?: CommunityVisibility; allowAnonymous?: boolean },
) {
  await connectDB();
  const slug = `custom-${slugify(input.name)}-${Date.now().toString(36)}`;
  const community = await Community.create({
    name: input.name,
    slug,
    type: "custom",
    scopeKey: null,
    description: input.description ?? "",
    icon: input.icon ?? null,
    visibility: input.visibility ?? "public",
    allowAnonymous: input.allowAnonymous ?? false,
    isOfficial: false,
    createdBy: userId,
  });
  await createDefaultChannels(community._id.toString());
  await joinCommunity(userId, community._id.toString(), "owner");
  return community;
}

export async function listMembers(communityId: string, page: number, pageSize: number) {
  await connectDB();
  const [members, total] = await Promise.all([
    CommunityMember.find({ communityId })
      .sort({ role: 1, joinedAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("userId", "username displayName avatar college campus city bio interests verified")
      .lean(),
    CommunityMember.countDocuments({ communityId }),
  ]);
  // Run the populated user through the same public-profile serializer as everywhere else —
  // otherwise the frontend gets a raw Mongoose shape (`_id`, no `id`) instead of the
  // PublicUserDTO it expects, and every member-management action silently targets "undefined".
  return {
    members: members.map((m) => ({
      userId: serializePublicUser(m.userId as unknown as Parameters<typeof serializePublicUser>[0]),
      role: m.role,
      muted: m.muted,
      banned: m.banned,
    })),
    total,
  };
}

/** Role changes are gated to owner/admin, and nobody but the owner can touch the owner role
 * or another admin's role — prevents a newly-promoted admin from demoting the owner. A site
 * admin (isSiteAdmin) bypasses the owner/admin-only gate and the "only the owner can touch an
 * admin" rule — same power an owner has — but still can't reassign the owner role itself,
 * exactly like a real owner can't either; a suspend/delete of the whole community is the tool
 * for a misbehaving owner. */
export async function updateMemberRole(
  actorRole: CommunityRole,
  communityId: string,
  targetUserId: string,
  newRole: Exclude<CommunityRole, "owner" | "guest">,
  isSiteAdmin = false,
) {
  await connectDB();
  if (!isSiteAdmin && !["owner", "admin"].includes(actorRole)) {
    return { success: false as const, error: "Not authorized" };
  }
  const target = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!target) return { success: false as const, error: "Member not found" };
  if (target.role === "owner") return { success: false as const, error: "Can't change the owner's role" };
  if (target.role === "admin" && actorRole !== "owner" && !isSiteAdmin) {
    return { success: false as const, error: "Only the owner can change an admin's role" };
  }

  target.role = newRole;
  await target.save();
  return { success: true as const, membership: target };
}

export async function setMemberModeration(
  actorRole: CommunityRole,
  communityId: string,
  targetUserId: string,
  patch: { muted?: boolean; banned?: boolean },
  isSiteAdmin = false,
) {
  await connectDB();
  if (!isSiteAdmin && !canModerate(actorRole)) return { success: false as const, error: "Not authorized" };
  const target = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!target) return { success: false as const, error: "Member not found" };
  if (target.role === "owner") return { success: false as const, error: "Can't moderate the owner" };
  // Same hierarchy as updateMemberRole: a moderator can act on regular members, but muting/
  // banning an admin (or a fellow moderator) needs admin-or-owner, not just "any moderator".
  if ((target.role === "admin" || target.role === "moderator") && actorRole === "moderator" && !isSiteAdmin) {
    return { success: false as const, error: "Only an admin or the owner can do that" };
  }

  if (patch.muted !== undefined) target.muted = patch.muted;
  if (patch.banned !== undefined) target.banned = patch.banned;
  await target.save();
  return { success: true as const, membership: target };
}

/** Outright removes a membership (as opposed to muting/banning, which keeps the row around).
 * A site admin can remove anyone, including the owner — the one hierarchy exception a plain
 * owner/admin doesn't get — since "manage an already-existing community like its owner" is
 * exactly the site admin's job here. */
export async function removeMember(
  actorRole: CommunityRole,
  communityId: string,
  targetUserId: string,
  isSiteAdmin = false,
) {
  await connectDB();
  if (!isSiteAdmin && !canModerate(actorRole)) return { success: false as const, error: "Not authorized" };
  const target = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!target) return { success: false as const, error: "Member not found" };
  if (target.role === "owner" && !isSiteAdmin) return { success: false as const, error: "Can't remove the owner" };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await CommunityMember.deleteOne({ _id: target._id }, { session });
      await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: -1 } }, { session });
    });
    return { success: true as const };
  } finally {
    await session.endSession();
  }
}

// --- Site-admin management (backend/src/routes/admin.routes.ts) ---------------------------
// A site admin owns every community in the system, not just the ones they created — these
// functions never check membership/role, only `requireAdmin` at the route layer.

export async function listAllCommunitiesForAdmin(filters: {
  status?: CommunityStatus;
  q?: string;
  page: number;
  pageSize: number;
}) {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.q) query.$text = { $search: filters.q };

  const [communities, total] = await Promise.all([
    Community.find(query)
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.pageSize)
      .limit(filters.pageSize)
      .lean(),
    Community.countDocuments(query),
  ]);
  return { communities, total };
}

/** Approve moves a pending (or previously-suspended) community back to fully visible; suspend
 * hides it from discovery and blocks it from `ensureCommunity` ever being mistaken for "already
 * live" by anyone browsing — but keeps it and its history intact, unlike delete. */
export async function adminSetCommunityStatus(id: string, status: CommunityStatus) {
  await connectDB();
  const community = await Community.findByIdAndUpdate(id, { status }, { new: true });
  if (!community) return { success: false as const, error: "Community not found" };
  return { success: true as const, community };
}

export async function adminUpdateCommunity(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    icon: string | null;
    visibility: CommunityVisibility;
    allowAnonymous: boolean;
    isOfficial: boolean;
  }>,
) {
  await connectDB();
  const community = await Community.findByIdAndUpdate(id, patch, { new: true });
  if (!community) return { success: false as const, error: "Community not found" };
  return { success: true as const, community };
}

/** Soft delete — reuses the `active` flag every read path in this file already filters on,
 * rather than a hard Mongo delete, since channels/messages/memberships still reference the
 * community and a site admin may want to restore it later. */
export async function adminDeleteCommunity(id: string) {
  await connectDB();
  const community = await Community.findByIdAndUpdate(id, { active: false }, { new: true });
  if (!community) return { success: false as const, error: "Community not found" };
  return { success: true as const };
}

export async function adminRestoreCommunity(id: string) {
  await connectDB();
  const community = await Community.findByIdAndUpdate(id, { active: true }, { new: true });
  if (!community) return { success: false as const, error: "Community not found" };
  return { success: true as const, community };
}

/** Adds a specific user (looked up by mobile — the same identifier admins already use to
 * provision accounts) directly to a community, bypassing self-join visibility rules. */
export async function adminAddMemberByMobile(communityId: string, mobile: string, role: CommunityRole = "member") {
  await connectDB();
  const [community, user] = await Promise.all([
    Community.findById(communityId).select("_id").lean(),
    User.findOne({ mobile: mobile.trim() }).select("_id").lean(),
  ]);
  if (!community) return { success: false as const, error: "Community not found" };
  if (!user) return { success: false as const, error: "No user found with that mobile number" };
  const membership = await joinCommunity(user._id.toString(), communityId, role);
  return { success: true as const, membership };
}

/** "Add all from city/campus/course/college, or every user in the system" — the bulk tool a
 * site admin uses on any community, admin-created or user-created alike. `joinCommunity` is
 * already idempotent and transactionally keeps `memberCount` correct, so this just fans out to
 * it for every matching user. */
export async function adminBulkAddMembers(
  communityId: string,
  filter: { city?: string; college?: string; campus?: string; courseId?: string; all?: boolean },
  role: CommunityRole = "member",
) {
  await connectDB();
  const before = await Community.findById(communityId).select("memberCount").lean();
  if (!before) return { success: false as const, error: "Community not found" };

  const query: Record<string, unknown> = {};
  if (!filter.all) {
    if (filter.city) query.city = filter.city;
    if (filter.college) query.college = filter.college;
    if (filter.campus) query.campus = filter.campus;
    if (filter.courseId) query.courseId = filter.courseId;
    if (Object.keys(query).length === 0) return { success: false as const, error: "No filter provided" };
  }

  const users = await User.find(query).select("_id").lean();
  await Promise.all(users.map((u) => joinCommunity(u._id.toString(), communityId, role)));
  const after = await Community.findById(communityId).select("memberCount").lean();
  return { success: true as const, matched: users.length, added: (after?.memberCount ?? 0) - (before.memberCount ?? 0) };
}

export function serializePublicUser(user: {
  _id: unknown;
  username?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  college?: string | null;
  campus?: string | null;
  city?: string | null;
  bio?: string | null;
  interests?: string[];
  verified?: boolean;
}) {
  return {
    id: String(user._id),
    username: user.username ?? "",
    displayName: user.displayName || user.username || "Student",
    avatar: user.avatar ?? null,
    college: user.college ?? null,
    campus: user.campus ?? null,
    city: user.city ?? null,
    bio: user.bio ?? "",
    interests: user.interests ?? [],
    verified: Boolean(user.verified),
  };
}

export async function getPublicProfileByUsername(username: string) {
  await connectDB();
  const user = await User.findOne({ username: username.toLowerCase() })
    .select("username displayName avatar college campus city bio interests verified")
    .lean();
  if (!user) return null;
  return serializePublicUser(user);
}
