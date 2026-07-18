import { Types } from "mongoose";

import { connectDB } from "@/db";
import { CampusTip } from "@/models/CampusTip";
// Imported for its side effect: registers the User schema so `.populate("authorId")` works
// even if nothing else has loaded the model in this process yet.
import "@/models/User";
import { escapeRegex } from "@/lib/regex";
import type { CampusTipCategory } from "@/types";

export type VoteDirection = "up" | "down" | "none";

export interface CampusTipInput {
  city: string;
  college: string;
  category: CampusTipCategory;
  text: string;
  linkUrl?: string | null;
  imageUrl?: string | null;
}

export interface CampusTipUpdateInput {
  category?: CampusTipCategory;
  text?: string;
  linkUrl?: string | null;
  imageUrl?: string | null;
}

interface PopulatedAuthor {
  _id: Types.ObjectId;
  name: string | null;
  avatar: string | null;
}

interface LeanTip {
  _id: Types.ObjectId;
  city: string;
  college: string;
  category: CampusTipCategory;
  text: string;
  linkUrl: string | null;
  imageUrl: string | null;
  authorId: PopulatedAuthor | null;
  upvoterIds: Types.ObjectId[];
  downvoterIds: Types.ObjectId[];
  score: number;
  hidden: boolean;
  createdAt: Date;
}

/** Voter arrays never leave the server — clients get counts plus their own vote. */
function toTipDTO(tip: LeanTip, viewerId: string) {
  const myVote = tip.upvoterIds.some((id) => id.equals(viewerId))
    ? "up"
    : tip.downvoterIds.some((id) => id.equals(viewerId))
      ? "down"
      : null;
  return {
    _id: tip._id.toString(),
    city: tip.city,
    college: tip.college,
    category: tip.category,
    text: tip.text,
    linkUrl: tip.linkUrl,
    imageUrl: tip.imageUrl,
    authorName: tip.authorId?.name ?? null,
    authorAvatar: tip.authorId?.avatar ?? null,
    upvotes: tip.upvoterIds.length,
    downvotes: tip.downvoterIds.length,
    myVote,
    isMine: tip.authorId?._id.equals(viewerId) ?? false,
    createdAt: tip.createdAt,
  };
}

export type CampusTipDTO = ReturnType<typeof toTipDTO>;

/** Both scope fields match case-insensitively (same convention as placeService's city), and
 * both go through escapeRegex — college names routinely contain regex metacharacters
 * ("IIT (BHU)"). */
export async function listTips(viewerId: string, city: string, college: string, category?: CampusTipCategory) {
  await connectDB();
  const filter: Record<string, unknown> = {
    city: new RegExp(`^${escapeRegex(city)}$`, "i"),
    college: new RegExp(`^${escapeRegex(college)}$`, "i"),
    hidden: false,
  };
  if (category) filter.category = category;

  const tips = await CampusTip.find(filter)
    .sort({ score: -1, createdAt: -1 })
    .limit(200)
    .populate("authorId", "name avatar")
    .lean<LeanTip[]>();
  return tips.map((tip) => toTipDTO(tip, viewerId));
}

export async function createTip(authorId: string, input: CampusTipInput) {
  await connectDB();
  const tip = await CampusTip.create({
    ...input,
    linkUrl: input.linkUrl || null,
    imageUrl: input.imageUrl || null,
    authorId,
  });
  const populated = await CampusTip.findById(tip._id).populate("authorId", "name avatar").lean<LeanTip>();
  return toTipDTO(populated!, authorId);
}

/** Authors edit their own tips; admins can edit anything (matching deleteTip). Returns null
 * when the tip doesn't exist or the caller isn't allowed to touch it — the route turns both
 * into a 404 rather than leaking which one it was. */
export async function updateTip(userId: string, isAdmin: boolean, tipId: string, input: CampusTipUpdateInput) {
  await connectDB();
  const filter: Record<string, unknown> = { _id: tipId };
  if (!isAdmin) filter.authorId = userId;
  const update: Record<string, unknown> = { ...input };
  if ("linkUrl" in input) update.linkUrl = input.linkUrl || null;
  if ("imageUrl" in input) update.imageUrl = input.imageUrl || null;

  const tip = await CampusTip.findOneAndUpdate(filter, update, { returnDocument: "after" })
    .populate("authorId", "name avatar")
    .lean<LeanTip>();
  return tip ? toTipDTO(tip, userId) : null;
}

export async function deleteTip(userId: string, isAdmin: boolean, tipId: string) {
  await connectDB();
  const filter: Record<string, unknown> = { _id: tipId };
  if (!isAdmin) filter.authorId = userId;
  const res = await CampusTip.deleteOne(filter);
  return res.deletedCount > 0;
}

/** One atomic pipeline update covers every transition — new vote, switching sides, retracting
 * ("none") — with `score` recomputed from the arrays in the same write, so concurrent votes
 * can't race a read-modify-write into a wrong count. */
export async function voteTip(userId: string, tipId: string, direction: VoteDirection) {
  await connectDB();
  const uid = new Types.ObjectId(userId);
  const updated = await CampusTip.findOneAndUpdate(
    { _id: tipId, hidden: false },
    [
      {
        $set: {
          upvoterIds:
            direction === "up"
              ? { $setUnion: ["$upvoterIds", [uid]] }
              : { $setDifference: ["$upvoterIds", [uid]] },
          downvoterIds:
            direction === "down"
              ? { $setUnion: ["$downvoterIds", [uid]] }
              : { $setDifference: ["$downvoterIds", [uid]] },
        },
      },
      { $set: { score: { $subtract: [{ $size: "$upvoterIds" }, { $size: "$downvoterIds" }] } } },
    ],
    // updatePipeline is Mongoose's opt-in for aggregation-pipeline updates — without it the
    // array form is rejected outright ("Cannot pass an array to query updates").
    { returnDocument: "after", updatePipeline: true },
  )
    .populate("authorId", "name avatar")
    .lean<LeanTip>();
  return updated ? toTipDTO(updated, userId) : null;
}
