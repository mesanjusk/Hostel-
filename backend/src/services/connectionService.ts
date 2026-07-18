import { connectDB } from "@/db";
import { Connection } from "@/models/Connection";
import { User } from "@/models/User";
import type { DiscoveryContext } from "@/types";

/** A requester/recipient ref after `.populate()` — the schema types both as a plain ObjectId,
 * which is what they are until populate swaps in the user document. */
type PopulatedRef = { _id: { toString(): string } };

export async function sendConnectionRequest(
  requesterId: string,
  recipientId: string,
  context: DiscoveryContext,
  message?: string,
) {
  await connectDB();

  if (requesterId === recipientId) {
    return { success: false as const, error: "You can't connect with yourself" };
  }

  const recipient = await User.findById(recipientId).lean();
  if (!recipient) {
    return { success: false as const, error: "User not found" };
  }
  if ((recipient.blockedUserIds ?? []).some((id) => id.toString() === requesterId)) {
    return { success: false as const, error: "This user isn't accepting requests" };
  }

  const existing = await Connection.findOne({ requesterId, recipientId, context });
  if (existing?.status === "accepted") {
    return { success: true as const, connection: existing };
  }

  // Requesting someone who has already requested you is a mutual match, not a second request:
  // accept theirs instead of opening a mirror document. The unique index is directional
  // (requester, recipient, context), so without this the pair ends up holding both A→B and
  // B→A — and once both are accepted every "my connections" query matches the pair twice.
  // A declined reciprocal is deliberately not reused: they turned you down, so this is a
  // fresh request in the other direction, not a match.
  const reciprocal = await Connection.findOne({
    requesterId: recipientId,
    recipientId: requesterId,
    context,
    status: { $in: ["pending", "accepted"] },
  });
  if (reciprocal) {
    if (reciprocal.status === "pending") {
      reciprocal.status = "accepted";
      reciprocal.respondedAt = new Date();
      await reciprocal.save();
    }
    return { success: true as const, connection: reciprocal };
  }

  // Upsert, but explicitly reset to "pending" on every send — otherwise re-requesting after
  // a decline would silently no-op (the old document already exists, so an insert-only
  // $setOnInsert never fires) and the recipient would never see the new request.
  const connection = await Connection.findOneAndUpdate(
    { requesterId, recipientId, context },
    { $set: { status: "pending", message: message ?? null, respondedAt: null } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  return { success: true as const, connection };
}

export async function respondToConnectionRequest(userId: string, connectionId: string, status: "accepted" | "declined") {
  await connectDB();

  if (status === "accepted") {
    const connection = await Connection.findOneAndUpdate(
      { _id: connectionId, recipientId: userId, status: "pending" },
      { status, respondedAt: new Date() },
      { returnDocument: "after" },
    );
    if (!connection) {
      return { success: false as const, error: "Request not found" };
    }
    return { success: true as const, connection };
  }

  // Declining. A pending request can only be turned down by the person it was sent to, but an
  // accepted one can be undone by either side — once matched, both are in it, so both can
  // leave. (Previously this only ever matched `status: "pending"`, so a match was permanent.)
  const target = await Connection.findOne({
    _id: connectionId,
    $or: [
      { recipientId: userId, status: "pending" },
      { status: "accepted", $or: [{ requesterId: userId }, { recipientId: userId }] },
    ],
  });
  if (!target) {
    return { success: false as const, error: "Request not found" };
  }

  // Decline every document between the two, in both directions. A pair predating the mutual
  // match guard above — or one created by two simultaneous sends — can hold A→B and B→A, and
  // declining only the one the UI happened to show would leave the other accepted, putting
  // the match straight back in the list.
  const pair = [target.requesterId, target.recipientId];
  await Connection.updateMany(
    {
      context: target.context,
      status: { $ne: "declined" },
      requesterId: { $in: pair },
      recipientId: { $in: pair },
    },
    { status: "declined", respondedAt: new Date() },
  );

  const connection = await Connection.findById(connectionId);
  return { success: true as const, connection };
}

// A populated ref comes back null when that user's account has since been deleted —
// deleting a user doesn't cascade to their connections, so such rows exist in production.
// A connection with nobody on the other end has nothing to render (and dereferencing the
// null crashed /connections/accepted with a 500), so every listing drops those rows.

export async function listIncomingRequests(userId: string) {
  await connectDB();
  const requests = await Connection.find({ recipientId: userId, status: "pending" })
    .sort({ createdAt: -1 })
    .populate("requesterId", "name avatar gender college verified")
    .lean();
  return requests.filter((request) => request.requesterId != null);
}

export async function listOutgoingRequests(userId: string) {
  await connectDB();
  const requests = await Connection.find({ requesterId: userId })
    .sort({ createdAt: -1 })
    .populate("recipientId", "name avatar gender college verified")
    .lean();
  return requests.filter((request) => request.recipientId != null);
}

export async function listAcceptedConnections(userId: string) {
  await connectDB();
  const connections = await Connection.find({
    status: "accepted",
    $or: [{ requesterId: userId }, { recipientId: userId }],
  })
    .sort({ respondedAt: -1 })
    .populate("requesterId", "name avatar gender college verified")
    .populate("recipientId", "name avatar gender college verified")
    .lean();

  // Collapse a mutual match to one row. Both A→B and B→A satisfy the filter above, so a pair
  // that requested each other and accepted would otherwise list the same person twice.
  // sendConnectionRequest now stops that second document being written, but this still has to
  // hold: pairs already matched that way exist, and two simultaneous sends can still race past
  // the guard. Keeping the first per (other user, context) keeps the most recently accepted
  // one, since the sort is respondedAt descending.
  const seen = new Set<string>();
  return connections.filter((connection) => {
    const { requesterId, recipientId } = connection as unknown as Record<
      "requesterId" | "recipientId",
      PopulatedRef | null
    >;
    // Deleted counterpart — see the note above listIncomingRequests.
    if (!requesterId || !recipientId) return false;
    const other = requesterId._id.toString() === userId ? recipientId : requesterId;
    const key = `${other._id.toString()}:${connection.context}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function blockUser(userId: string, targetUserId: string) {
  await connectDB();
  if (userId === targetUserId) {
    return { success: false as const, error: "You can't block yourself" };
  }
  await User.findByIdAndUpdate(userId, { $addToSet: { blockedUserIds: targetUserId } });
  // Any pending requests between the two are no longer actionable.
  await Connection.updateMany(
    {
      status: "pending",
      $or: [
        { requesterId: userId, recipientId: targetUserId },
        { requesterId: targetUserId, recipientId: userId },
      ],
    },
    { status: "declined", respondedAt: new Date() },
  );
  return { success: true as const };
}

export async function unblockUser(userId: string, targetUserId: string) {
  await connectDB();
  await User.findByIdAndUpdate(userId, { $pull: { blockedUserIds: targetUserId } });
  return { success: true as const };
}

export async function listBlockedUsers(userId: string) {
  await connectDB();
  const user = await User.findById(userId).populate("blockedUserIds", "name avatar mobile").lean();
  return user?.blockedUserIds ?? [];
}
