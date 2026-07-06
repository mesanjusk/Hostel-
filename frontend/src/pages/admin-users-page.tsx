import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { useAuth } from "@/context/auth-context";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { UsersView } from "@/features/admin/users-view";
import type { AdminUserDTO } from "@/features/admin/user-dto";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [total, setTotal] = useState(0);

  async function fetchData() {
    try {
      const result = await api.get<{ users: AdminUserDTO[]; total: number }>(
        `/api/admin/users?page=${page}&pageSize=${PAGE_SIZE}`,
      );
      setUsers(result.users);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load users");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminTabs />
      <UsersView users={users} page={page} totalPages={totalPages} currentUserId={currentUser?.id ?? null} />
    </div>
  );
}
