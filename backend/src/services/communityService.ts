import { connectDB } from "@/db";
import { Community, type CommunityDocument } from "@/models/Community";
import { CommunityMember } from "@/models/CommunityMember";
import { Channel } from "@/models/Channel";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { slugify } from "@/lib/slug";
import type { CommunityRole, CommunityType, CommunityVisibility } from "@/types";
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
  options: { description?: string; icon?: string; isOfficial?: boolean; visibility?: CommunityVisibility } = {},
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

/** Idempotently adds a membership and bumps the denormalized member count only on first join. */
export async function joinCommunity(userId: string, communityId: string, role: CommunityRole = "member") {
  await connectDB();
  const existing = await CommunityMember.findOne({ communityId, userId });
  if (existing) return existing;

  const membership = await CommunityMember.create({ communityId, userId, role, joinedAt: new Date() });
  await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: 1 } });
  return membership;
}

export async function leaveCommunity(userId: string, communityId: string) {
  await connectDB();
  const removed = await CommunityMember.findOneAndDelete({ communityId, userId });
  if (removed) {
    await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: -1 } });
  }
  return { success: true as const };
}

/** Auto-join, run right after onboarding/profile update: joins the student to every
 * community their current profile implies (country, city, college, course, year, plus the
 * fixed global utility communities). Purely additive — never removes a membership the
 * student already has (e.g. an interest community they joined manually), and re-running it
 * after a profile edit (new city, new course) just adds the newly-implied ones. */
export async function ensureAutoJoinCommunities(user: AutoJoinableUser) {
  await connectDB();
  const userId = user._id.toString();
  const joins: Array<Promise<unknown>> = [];

  const country = await ensureCommunity("country", "india", "India", { description: "All students across India." });
  joins.push(joinCommunity(userId, country._id.toString()));

  if (user.city) {
    const city = await ensureCommunity("city", user.city, `${user.city} Students`, {
      description: `Students living in or heading to ${user.city}.`,
    });
    joins.push(joinCommunity(userId, city._id.toString()));
  }

  if (user.college) {
    const college = await ensureCommunity("college", user.college, user.college, {
      description: `The community for everyone at ${user.college}.`,
    });
    joins.push(joinCommunity(userId, college._id.toString()));

    if (user.campus) {
      const campusKey = `${user.college}::${user.campus}`;
      const campus = await ensureCommunity("campus", campusKey, `${user.college} — ${user.campus}`, {
        description: `The ${user.campus} campus community.`,
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
      });
      joins.push(joinCommunity(userId, courseCommunity._id.toString()));

      if (user.year) {
        const yearKey = `${courseKey}:${user.year}`;
        const yearCommunity = await ensureCommunity("year", yearKey, `${course.name} — Year ${user.year}`, {
          description: `${course.name} students in year ${user.year}.`,
        });
        joins.push(joinCommunity(userId, yearCommunity._id.toString()));
      }
    }
  }

  const globalCommunities: Array<{ type: CommunityType; name: string; description: string }> = [
    { type: "general", name: "General Discussion", description: "Campus life, chit-chat, anything goes." },
    { type: "marketplace", name: "Buy & Sell", description: "Books, electronics, hostel items — buy, sell, exchange, or give away." },
    { type: "events", name: "Events", description: "Fests, workshops, hackathons, meetups." },
    { type: "lost_found", name: "Lost & Found", description: "Lost something on campus? Found something? Post it here." },
  ];

  for (const g of globalCommunities) {
    const community = await ensureCommunity(g.type, "global", g.name, { description: g.description });
    joins.push(joinCommunity(userId, community._id.toString()));
  }

  for (const interest of user.interests ?? []) {
    const key = slugify(interest);
    if (!key) continue;
    const community = await ensureCommunity("interest", key, interest, {
      description: `For students into ${interest}.`,
      isOfficial: false,
    });
    joins.push(joinCommunity(userId, community._id.toString()));
  }

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

  const query: Record<string, unknown> = { active: true, visibility: "public" };
  if (filters.type) query.type = filters.type;
  if (filters.q) query.$text = { $search: filters.q };

  // Sorting by the $meta textScore requires it to also be projected — MongoDB rejects the
  // sort otherwise. Only relevant for a text search; the plain "most members first" branch
  // needs no projection.
  const [communities, total] = await Promise.all([
    Community.find(query, filters.q ? { score: { $meta: "textScore" } } : undefined)
      .sort(filters.q ? { score: { $meta: "textScore" } } : { memberCount: -1 })
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
      .populate("userId", "username displayName avatar verified")
      .lean(),
    CommunityMember.countDocuments({ communityId }),
  ]);
  return { members, total };
}

/** Role changes are gated to owner/admin, and nobody but the owner can touch the owner role
 * or another admin's role — prevents a newly-promoted admin from demoting the owner. */
export async function updateMemberRole(
  actorRole: CommunityRole,
  communityId: string,
  targetUserId: string,
  newRole: Exclude<CommunityRole, "owner" | "guest">,
) {
  await connectDB();
  if (!["owner", "admin"].includes(actorRole)) {
    return { success: false as const, error: "Not authorized" };
  }
  const target = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!target) return { success: false as const, error: "Member not found" };
  if (target.role === "owner") return { success: false as const, error: "Can't change the owner's role" };
  if (target.role === "admin" && actorRole !== "owner") {
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
) {
  await connectDB();
  if (!canModerate(actorRole)) return { success: false as const, error: "Not authorized" };
  const target = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!target) return { success: false as const, error: "Member not found" };
  if (target.role === "owner") return { success: false as const, error: "Can't moderate the owner" };

  if (patch.muted !== undefined) target.muted = patch.muted;
  if (patch.banned !== undefined) target.banned = patch.banned;
  await target.save();
  return { success: true as const, membership: target };
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
