import type { HydratedDocument } from "mongoose";

import type { UserDocument } from "@/models/User";
import type { UserDTO } from "@/types";

export function serializeUser(user: HydratedDocument<UserDocument>): UserDTO {
  return {
    id: user._id.toString(),
    name: user.name ?? null,
    mobile: user.mobile,
    avatar: user.avatar ?? null,
    college: user.college ?? null,
    hostel: user.hostel ?? null,
    roomNumber: user.roomNumber ?? null,
    role: user.role as UserDTO["role"],
    theme: user.theme as UserDTO["theme"],
    needsOnboarding: !user.name,
    createdAt: (user as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}

/** Converts lean Mongoose documents (ObjectId/Date) into plain JSON-safe objects. */
export function toPlain<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}
