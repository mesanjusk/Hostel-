import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { listUsers } from "@/services/userService";
import { toPlain } from "@/lib/serialize";
import { UsersView } from "@/features/admin/users-view";
import type { AdminUserDTO } from "@/features/admin/user-dto";

export const metadata: Metadata = { title: "Users — Admin" };

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [session, { users, total }] = await Promise.all([auth(), listUsers(page, PAGE_SIZE)]);
  const plain = toPlain(users);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const dtoUsers: AdminUserDTO[] = plain.map((user) => ({
    id: user._id,
    name: user.name ?? null,
    mobile: user.mobile,
    college: user.college ?? null,
    hostel: user.hostel ?? null,
    roomNumber: user.roomNumber ?? null,
    role: user.role,
    hasPinSet: Boolean(user.loginPinHash),
    createdAt: user.createdAt,
  }));

  return (
    <UsersView
      users={dtoUsers}
      page={page}
      totalPages={totalPages}
      currentUserId={session?.user.id ?? null}
    />
  );
}
