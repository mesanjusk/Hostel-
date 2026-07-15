import type { HydratedDocument } from "mongoose";

import type { UserDocument } from "@/models/User";
import type { UserDTO } from "@/types";

export function serializeUser(user: HydratedDocument<UserDocument>): UserDTO {
  return {
    id: user._id.toString(),
    name: user.name ?? null,
    mobile: user.mobile,
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
    needsOnboarding: !user.name,
    verified: Boolean(user.verified),
    createdAt: (user as unknown as { createdAt: Date }).createdAt.toISOString(),
    username: user.username ?? null,
    displayName: user.displayName ?? null,
    bio: user.bio ?? null,
    interests: user.interests ?? [],
    campus: user.campus ?? null,
    year: user.year ?? null,
  };
}

/** Converts lean Mongoose documents (ObjectId/Date) into plain JSON-safe objects. */
export function toPlain<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}
