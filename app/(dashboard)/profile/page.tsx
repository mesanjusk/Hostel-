import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getUserById } from "@/services/userService";
import { toPlain } from "@/lib/serialize";
import { ProfileView } from "@/features/profile/profile-view";
import type { UserRole } from "@/types";

export const metadata: Metadata = { title: "Profile — Hostel Essentials" };

export interface ProfileDTO {
  id: string;
  name: string | null;
  mobile: string;
  avatar: string | null;
  college: string | null;
  hostel: string | null;
  roomNumber: string | null;
  role: UserRole;
  notificationsEnabled: boolean;
}

export default async function ProfilePage() {
  const session = await auth();
  const user = await getUserById(session!.user.id);
  const plainUser = user ? toPlain(user) : null;

  const profile: ProfileDTO = {
    id: session!.user.id,
    name: plainUser?.name ?? null,
    mobile: plainUser?.mobile ?? session!.user.mobile,
    avatar: plainUser?.avatar ?? null,
    college: plainUser?.college ?? null,
    hostel: plainUser?.hostel ?? null,
    roomNumber: plainUser?.roomNumber ?? null,
    role: (plainUser?.role as UserRole) ?? session!.user.role,
    notificationsEnabled: plainUser?.notificationsEnabled ?? true,
  };

  return <ProfileView profile={profile} />;
}
