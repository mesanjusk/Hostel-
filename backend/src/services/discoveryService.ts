import { connectDB } from "@/db";
import { Connection } from "@/models/Connection";
import { TravelProfile, type TravelProfileDocument } from "@/models/TravelProfile";
import { User, type UserDocument } from "@/models/User";
import type { DiscoveryQuery } from "@/validations/discovery";
import type { HydratedDocument, Types } from "mongoose";

type ProfileWithUser = TravelProfileDocument & {
  _id: Types.ObjectId;
  userId: Pick<UserDocument, "name" | "avatar" | "gender" | "college" | "verified" | "dateOfBirth"> & {
    _id: Types.ObjectId;
  };
};

function ageFromDob(dob: Date | null | undefined): number | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

/** A candidate is hidden from `viewer` if they've hidden their profile entirely, restricted
 * themselves to same-gender-only viewers and the viewer doesn't qualify, or the viewer has
 * blocked them. The reverse (they've blocked the viewer) is checked by the caller via
 * `blockedByOthers`, since that requires a separate lookup across all users. */
function isVisibleTo(candidate: ProfileWithUser, viewer: HydratedDocument<UserDocument>): boolean {
  const v = candidate.visibility;
  if (v?.hideProfile) return false;
  if (v?.onlyShowSameGender && candidate.userId.gender && candidate.userId.gender !== viewer.gender) return false;

  const candidateUserId = candidate.userId._id.toString();
  const viewerBlockedThem = (viewer.blockedUserIds ?? []).some((id) => id.toString() === candidateUserId);
  return !viewerBlockedThem;
}

function baseCard(profile: ProfileWithUser) {
  return {
    userId: profile.userId._id.toString(),
    name: profile.userId.name,
    avatar: profile.userId.avatar,
    gender: profile.userId.gender,
    verified: profile.userId.verified,
    college: profile.college ?? profile.userId.college,
    currentCity: profile.currentCity,
    destinationCity: profile.destinationCity,
    accommodationType: profile.accommodationType,
    budgetMin: profile.budgetMin,
    budgetMax: profile.budgetMax,
    interests: profile.interests,
    languages: profile.languages,
    lifestyleTags: profile.lifestyleTags,
    age: ageFromDob(profile.userId.dateOfBirth),
  };
}

async function loadViewerContext(viewerUserId: string) {
  const viewer = await User.findById(viewerUserId);
  if (!viewer) throw new Error("Viewer not found");
  const myProfile = await TravelProfile.findOne({ userId: viewerUserId }).lean();
  const blockedByOthersIds = await User.find({ blockedUserIds: viewer._id }).distinct("_id");
  const blockedByOthers = new Set(blockedByOthersIds.map(String));
  return { viewer, myProfile, blockedByOthers };
}

function applyOptionalFilters(profiles: ProfileWithUser[], filters: DiscoveryQuery) {
  return profiles.filter((p) => {
    if (filters.gender && p.userId.gender !== filters.gender) return false;
    if (filters.college && !(p.college ?? p.userId.college ?? "").toLowerCase().includes(filters.college.toLowerCase())) return false;
    if (filters.accommodationType && !accommodationSatisfied(filters.accommodationType, p.accommodationType)) return false;
    if (filters.budgetMax != null && p.budgetMin != null && p.budgetMin > filters.budgetMax) return false;
    if ((filters.ageMin != null || filters.ageMax != null)) {
      const age = ageFromDob(p.userId.dateOfBirth);
      if (age == null) return false;
      if (filters.ageMin != null && age < filters.ageMin) return false;
      if (filters.ageMax != null && age > filters.ageMax) return false;
    }
    return true;
  });
}

/** Co-Packer discovery: same origin city and same destination city as the viewer's own saved
 * profile — that pair is mandatory; gender/college/age are optional refinements on top.
 * Requires the viewer to have saved a profile first (there's nothing to match against
 * otherwise).
 *
 * Timing is deliberately not part of this any more. It used to also require the same travel
 * month, which made the match tighter but cost every student a date they often didn't have
 * yet; the profile no longer collects one. Two people on the same route months apart will now
 * match, so treat this as "who else is making this move", not "who else is going when I am".
 *
 * Current city is optional on the profile now too. When the viewer hasn't set one, requiring
 * an exact match on it would mean matching only other blank-city profiles — effectively no
 * one — so the match widens to destination city alone instead. Same tradeoff as the travel-
 * month removal: a looser match beats asking for a field that isn't worth the friction. */
export async function findCoPackers(viewerUserId: string, filters: DiscoveryQuery) {
  await connectDB();
  const { viewer, myProfile, blockedByOthers } = await loadViewerContext(viewerUserId);
  if (!myProfile) return [];

  const candidates = await TravelProfile.find({
    userId: { $ne: viewer._id },
    ...(myProfile.currentCity ? { currentCity: myProfile.currentCity } : {}),
    destinationCity: myProfile.destinationCity,
    active: true,
  })
    .populate("userId", "name avatar gender college verified dateOfBirth blockedUserIds")
    .lean<ProfileWithUser[]>();

  // A profile can outlive the account it belonged to (e.g. an admin-deleted user whose
  // TravelProfile wasn't cleaned up) — populate then leaves userId null instead of a document,
  // which would otherwise crash every field access below.
  const withUser = candidates.filter((c) => c.userId != null);

  const visible = withUser.filter(
    (c) => isVisibleTo(c, viewer) && !blockedByOthers.has(c.userId._id.toString()),
  );
  return applyOptionalFilters(visible, filters).map(baseCard);
}

/** Does `gender` satisfy a stated `preference`? "Any" accepts everyone and is a real answer
 * ("I don't mind"), not a blank. A specific preference needs a specific match, so someone with
 * no gender recorded can't satisfy one. */
function genderPreferenceSatisfied(preference: string | null | undefined, gender: string | null | undefined) {
  if (!preference || preference === "Any") return true;
  return gender === preference;
}

/** Do two accommodation preferences agree? Unlike gender preference this is symmetric — it's
 * the kind of place each of us wants, not a statement about the other person — so either side
 * saying "Any" is enough: someone flexible will happily take the hostel you're set on. Only a
 * clash of two specific types rules the match out. A null (legacy profiles, written before
 * this field had a default) is not flexibility, just an absence, so it satisfies nothing. */
function accommodationSatisfied(mine: string | null | undefined, theirs: string | null | undefined) {
  if (!mine || !theirs) return false;
  return mine === "Any" || theirs === "Any" || mine === theirs;
}

/** Everything a roommate match needs from a profile before it can be compared against anyone
 * else's. Checked against the viewer's own profile too — matching is mutual, so an incomplete
 * profile matches nobody. `genderPreference` isn't here: it defaults to "Any", so it's never
 * actually absent. `accommodationType` now defaults to "Any" as well, which leaves budget as
 * the only field a student can really be missing — but a profile saved before either default
 * existed can still have a bare null, and null is not the same answer as "Any". */
export function isRoommateProfileComplete(profile: {
  budgetMin?: number | null;
  budgetMax?: number | null;
  accommodationType?: string | null;
}) {
  return profile.budgetMin != null && profile.budgetMax != null && Boolean(profile.accommodationType);
}

/** Roommate discovery. Four conditions are mandatory, and a candidate failing any of them is
 * not shown at all: same destination city, overlapping budget, mutually acceptable gender
 * preference, and a compatible accommodation type. College, interests, languages and lifestyle
 * feed the compatibility score only.
 *
 * There are no filter arguments: the four requirements come from the viewer's own profile, so
 * Find a Roomie has no filter bar to send any (see RoommateView). Dates and age play no part
 * here, and no longer exist on the profile at all.
 *
 * Candidates the viewer has already connected with (either direction, accepted) are dropped
 * from the deck entirely — they now live in the Connections section of the merged Matches
 * page, not here. Candidates with a pending outgoing request from the viewer stay in the deck
 * but carry `requestStatus: "sent"`, so the merged page can fold "sent requests" into this
 * same list as a disabled card state instead of a separate tab. */
export async function findRoommates(viewerUserId: string) {
  await connectDB();
  const { viewer, myProfile, blockedByOthers } = await loadViewerContext(viewerUserId);
  if (!myProfile) return [];
  // The requirements cut both ways: without a budget and an accommodation type of their own
  // there's nothing to match the viewer against. Bail before querying rather than build a
  // filter out of nulls. The UI checks the same thing so it can explain the empty screen
  // instead of blaming the city.
  if (!isRoommateProfileComplete(myProfile)) return [];

  const candidates = await TravelProfile.find({
    userId: { $ne: viewer._id },
    active: true,
    // 1. Destination city.
    destinationCity: myProfile.destinationCity,
    // 4. Accommodation type — compatible, not identical: "Any" on either side agrees with
    //    everything (see accommodationSatisfied). $ne null drops legacy profiles that predate
    //    the field's default, since an absent answer isn't flexibility.
    accommodationType:
      myProfile.accommodationType === "Any" ? { $ne: null } : { $in: [myProfile.accommodationType, "Any"] },
    // 2. Budget — the two ranges must intersect. Touching at a single value counts: if they'll
    //    pay up to 8000 and I start at 8000, then 8000 works for both of us. Comparison
    //    operators don't match null, so an unset budget is excluded by these clauses.
    budgetMin: { $lte: myProfile.budgetMax },
    budgetMax: { $gte: myProfile.budgetMin },
    // 3a. Their preference has to accept my gender. If I have no gender recorded, only people
    //     who don't mind can match me.
    genderPreference: { $in: viewer.gender ? ["Any", viewer.gender] : ["Any"] },
  })
    .populate("userId", "name avatar gender college verified dateOfBirth blockedUserIds")
    .lean<ProfileWithUser[]>();

  // Same orphaned-profile guard as findCoPackers: a deleted user's TravelProfile can still
  // match the query above, and populate leaves userId null rather than throwing.
  const withUser = candidates.filter((c) => c.userId != null);

  const visible = withUser.filter(
    (c) =>
      isVisibleTo(c, viewer) &&
      !blockedByOthers.has(c.userId._id.toString()) &&
      // 3b. ...and my preference has to accept their gender. The other half of the mutual
      //     check is in the query above; this side needs the populated user, so it lands here.
      genderPreferenceSatisfied(myProfile.genderPreference, c.userId.gender),
  );

  // Roommate-context connections between the viewer and any candidate — used to drop already-
  // accepted candidates from the deck and to flag pending outgoing ones as "sent".
  const connections = await Connection.find({
    context: "roommate",
    $or: [{ requesterId: viewer._id }, { recipientId: viewer._id }],
    status: { $in: ["pending", "accepted"] },
  }).lean();

  const acceptedOtherIds = new Set<string>();
  const sentToIds = new Set<string>();
  for (const conn of connections) {
    const requesterId = conn.requesterId.toString();
    const recipientId = conn.recipientId.toString();
    const otherId = requesterId === viewer._id.toString() ? recipientId : requesterId;
    if (conn.status === "accepted") acceptedOtherIds.add(otherId);
    else if (conn.status === "pending" && requesterId === viewer._id.toString()) sentToIds.add(otherId);
  }

  return visible
    .filter((c) => !acceptedOtherIds.has(c.userId._id.toString()))
    .map((c) => ({
      ...baseCard(c),
      compatibilityScore: computeCompatibility(myProfile, c),
      requestStatus: sentToIds.has(c.userId._id.toString()) ? ("sent" as const) : null,
    }))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

function computeCompatibility(mine: TravelProfileDocument, theirs: ProfileWithUser): number {
  let score = 0;
  const myInterests = new Set(mine.interests ?? []);
  const sharedInterests = (theirs.interests ?? []).filter((i) => myInterests.has(i)).length;
  score += sharedInterests * 15;

  const myLanguages = new Set(mine.languages ?? []);
  const sharedLanguages = (theirs.languages ?? []).filter((l) => myLanguages.has(l)).length;
  score += sharedLanguages * 10;

  const myLifestyle = new Set(mine.lifestyleTags ?? []);
  const sharedLifestyle = (theirs.lifestyleTags ?? []).filter((t) => myLifestyle.has(t)).length;
  score += sharedLifestyle * 10;

  if (mine.college && theirs.college === mine.college) score += 15;
  // Both wanting the same *specific* place is a genuine signal; two "Any"s agreeing is not —
  // that's just neither of us having a view, and it shouldn't outrank a real preference match.
  if (mine.accommodationType && mine.accommodationType !== "Any" && theirs.accommodationType === mine.accommodationType) {
    score += 10;
  }

  if (mine.budgetMin != null && mine.budgetMax != null && theirs.budgetMin != null && theirs.budgetMax != null) {
    const overlap = Math.min(mine.budgetMax, theirs.budgetMax) - Math.max(mine.budgetMin, theirs.budgetMin);
    if (overlap > 0) score += 20;
  }

  return Math.min(100, score);
}
