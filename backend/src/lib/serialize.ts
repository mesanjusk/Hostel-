import type { HydratedDocument } from "mongoose";

import type { UserDocument } from "@/models/User";
import type { UserDTO } from "@/types";

export function serializeUser(user: HydratedDocument<UserDocument>): UserDTO {
  return {
    id: user._id.toString(),
    name: user.name ?? null,
    // Null for a still-anonymous visitor — see the User model's `mobile` field comment.
    mobile: user.mobile ?? null,
    avatar: user.avatar ?? null,
    gender: (user.gender as UserDTO["gender"]) ?? null,
    college: user.college ?? null,
    collegeCategory: (user.collegeCategory as UserDTO["collegeCategory"]) ?? null,
    collegeCategoryId: user.collegeCategoryId ? String(user.collegeCategoryId) : null,
    courseId: user.courseId ? String(user.courseId) : null,
    city: user.city ?? null,
    homeTown: user.homeTown ?? null,
    role: user.role as UserDTO["role"],
    theme: user.theme as UserDTO["theme"],
    // An anonymous (no mobile yet) visitor is never forced through onboarding — they land
    // straight on the sticky-notes Home page and pick up a name/gender at their own pace (the
    // Home gender popup, or later if they ever bother with Profile). Onboarding only becomes
    // mandatory once a mobile number is attached and there's still no name on file.
    needsOnboarding: Boolean(user.mobile) && !user.name,
    verified: Boolean(user.verified),
    createdAt: (user as unknown as { createdAt: Date }).createdAt.toISOString(),
    username: user.username ?? null,
    displayName: user.displayName ?? null,
    bio: user.bio ?? null,
    interests: user.interests ?? [],
    campus: user.campus ?? null,
    year: user.year ?? null,
    communityProfileConfigured: Boolean(user.communityProfileConfigured),
    waBroadcastEnabled: user.waBroadcastEnabled ?? true,
    waWindowOpenedAt: user.waWindowOpenedAt ? user.waWindowOpenedAt.toISOString() : null,
  };
}

/** Converts lean Mongoose documents (ObjectId/Date) into plain JSON-safe objects. */
export function toPlain<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}
