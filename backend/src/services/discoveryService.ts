import { connectDB } from "@/db";
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
 * themselves to verified-only or same-gender-only viewers and the viewer doesn't qualify, or
 * the viewer has blocked them. The reverse (they've blocked the viewer) is checked by the
 * caller via `blockedByOthers`, since that requires a separate lookup across all users. */
function isVisibleTo(candidate: ProfileWithUser, viewer: HydratedDocument<UserDocument>): boolean {
  const v = candidate.visibility;
  if (v?.hideProfile) return false;
  if (v?.onlyShowVerified && !viewer.verified) return false;
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
    travelMonth: profile.travelMonth,
    arrivalDate: profile.arrivalDate,
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
    if (filters.accommodationType && p.accommodationType !== filters.accommodationType) return false;
    if (filters.budgetMax != null && p.budgetMin != null && p.budgetMin > filters.budgetMax) return false;
    if (filters.arrivalWeek && p.arrivalDate) {
      const diffDays = Math.abs((p.arrivalDate.getTime() - filters.arrivalWeek.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays > 7) return false;
    }
    if ((filters.ageMin != null || filters.ageMax != null)) {
      const age = ageFromDob(p.userId.dateOfBirth);
      if (age == null) return false;
      if (filters.ageMin != null && age < filters.ageMin) return false;
      if (filters.ageMax != null && age > filters.ageMax) return false;
    }
    return true;
  });
}

/** Co-Packer discovery: same origin city, same destination city, same travel month as the
 * viewer's own saved profile — that triple is mandatory; gender/college/age are optional
 * refinements on top. Requires the viewer to have saved a profile first (there's nothing to
 * match against otherwise). */
export async function findCoPackers(viewerUserId: string, filters: DiscoveryQuery) {
  await connectDB();
  const { viewer, myProfile, blockedByOthers } = await loadViewerContext(viewerUserId);
  if (!myProfile) return [];

  const candidates = await TravelProfile.find({
    userId: { $ne: viewer._id },
    currentCity: myProfile.currentCity,
    destinationCity: myProfile.destinationCity,
    travelMonth: myProfile.travelMonth,
    active: true,
  })
    .populate("userId", "name avatar gender college verified dateOfBirth blockedUserIds")
    .lean<ProfileWithUser[]>();

  const visible = candidates.filter(
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

/** Everything a roommate match needs from a profile before it can be compared against anyone
 * else's. Checked against the viewer's own profile too — matching is mutual, so an incomplete
 * profile matches nobody. `genderPreference` isn't here: it defaults to "Any", so it's never
 * actually absent. */
export function isRoommateProfileComplete(profile: {
  budgetMin?: number | null;
  budgetMax?: number | null;
  accommodationType?: string | null;
}) {
  return profile.budgetMin != null && profile.budgetMax != null && Boolean(profile.accommodationType);
}

/** Find a Roomie's filter-bar refinements. Deliberately narrower than the co-packer set:
 * arrival week and age are no longer part of roommate matching, so they aren't honoured here
 * even if an older client still sends them. */
function applyRoommateFilters(profiles: ProfileWithUser[], filters: DiscoveryQuery) {
  return profiles.filter((p) => {
    if (filters.gender && p.userId.gender !== filters.gender) return false;
    if (filters.college && !(p.college ?? p.userId.college ?? "").toLowerCase().includes(filters.college.toLowerCase())) return false;
    if (filters.accommodationType && p.accommodationType !== filters.accommodationType) return false;
    if (filters.budgetMax != null && p.budgetMin != null && p.budgetMin > filters.budgetMax) return false;
    return true;
  });
}

/** Roommate discovery. Four conditions are mandatory, and a candidate failing any of them is
 * not shown at all: same destination city, overlapping budget, mutually acceptable gender
 * preference, and the same accommodation type. Everything else — college, interests,
 * languages, lifestyle — is an optional filter or feeds the compatibility score only.
 *
 * Travel month, arrival date and age play no part here. Co-Packer still matches on travel
 * month (see findCoPackers); that's why the field stays on the profile. */
export async function findRoommates(viewerUserId: string, filters: DiscoveryQuery) {
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
    // 4. Accommodation type — the same one. A null never equals a real type, so profiles that
    //    haven't set one drop out here.
    accommodationType: myProfile.accommodationType,
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

  const visible = candidates.filter(
    (c) =>
      isVisibleTo(c, viewer) &&
      !blockedByOthers.has(c.userId._id.toString()) &&
      // 3b. ...and my preference has to accept their gender. The other half of the mutual
      //     check is in the query above; this side needs the populated user, so it lands here.
      genderPreferenceSatisfied(myProfile.genderPreference, c.userId.gender),
  );

  return applyRoommateFilters(visible, filters)
    .map((c) => ({ ...baseCard(c), compatibilityScore: computeCompatibility(myProfile, c) }))
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
  if (mine.accommodationType && theirs.accommodationType === mine.accommodationType) score += 10;

  if (mine.budgetMin != null && mine.budgetMax != null && theirs.budgetMin != null && theirs.budgetMax != null) {
    const overlap = Math.min(mine.budgetMax, theirs.budgetMax) - Math.max(mine.budgetMin, theirs.budgetMin);
    if (overlap > 0) score += 20;
  }

  return Math.min(100, score);
}
