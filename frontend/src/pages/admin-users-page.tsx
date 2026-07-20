import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { useAuth } from "@/context/auth-context";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { UsersView } from "@/features/admin/users-view";
import type { AdminUserDTO } from "@/features/admin/user-dto";

const PAGE_SIZE = 20;
type UserStatusTab = "registered" | "anonymous";

/** Registered (linked a mobile number via OTP) and Anonymous (still just a browser-created
 * account — see auth-context.tsx's anonymous session) are kept on separate tabs rather than
 * one merged list: a fully-anonymous account has nothing meaningful to show in most of this
 * table's columns (mobile, login code), and the two populations answer very different
 * questions ("who actually signed up" vs "how many visitors haven't yet"). */
export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const status: UserStatusTab = searchParams.get("status") === "anonymous" ? "anonymous" : "registered";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [anonymousCount, setAnonymousCount] = useState(0);

  async function fetchData() {
    try {
      const result = await api.get<{
        users: AdminUserDTO[];
        total: number;
        registeredCount: number;
        anonymousCount: number;
      }>(`/api/admin/users?page=${page}&pageSize=${PAGE_SIZE}&status=${status}`);
      setUsers(result.users);
      setTotal(result.total);
      setRegisteredCount(result.registeredCount);
      setAnonymousCount(result.anonymousCount);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load users");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE));

  // A stale/bookmarked `?page=` beyond the real page count (e.g. after users were deleted,
  // or the list simply shrank) would otherwise render an empty table and misleadingly claim
  // "No students yet" even though plenty of users exist — snap back to the last valid page.
  useEffect(() => {
    if (total !== null && total > 0 && page > totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (totalPages > 1) next.set("page", String(totalPages));
        else next.delete("page");
        return next;
      }, { replace: true });
    }
  }, [total, page, totalPages, setSearchParams]);

  function handleTabChange(next: string) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === "anonymous") params.set("status", "anonymous");
      else params.delete("status");
      params.delete("page");
      return params;
    });
  }

  return (
    <div>
      <AdminTabs />
      <Tabs value={status} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="registered">Registered ({registeredCount.toLocaleString("en-IN")})</TabsTrigger>
          <TabsTrigger value="anonymous">Anonymous ({anonymousCount.toLocaleString("en-IN")})</TabsTrigger>
        </TabsList>
        <TabsContent value={status}>
          <UsersView
            users={users}
            page={page}
            totalPages={totalPages}
            totalUsers={total ?? 0}
            currentUserId={currentUser?.id ?? null}
            status={status}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
