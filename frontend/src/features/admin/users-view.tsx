import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { KeyRound, Users } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UserFormDialog } from "@/features/admin/user-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { formatMobileForDisplay } from "@/lib/phone";
import type { AdminUserDTO } from "@/features/admin/user-dto";

function formatTimeSpent(seconds: number): string {
  if (seconds <= 0) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export function UsersView({
  users: initialUsers,
  page,
  totalPages,
  totalUsers,
  currentUserId,
  status,
}: {
  users: AdminUserDTO[];
  page: number;
  totalPages: number;
  totalUsers: number;
  currentUserId: string | null;
  /** Which tab this table is rendering for — an anonymous account has nothing meaningful in
   * Mobile/Login code/Role/Verified (always "Not linked"/"Not set"/"student"/unverified), so
   * that tab swaps those columns for Device and Gender instead. */
  status: "registered" | "anonymous";
}) {
  const [users, setUsers] = useState(initialUsers);
  const isAnonymousTab = status === "anonymous";

  // `initialUsers` starts as [] while the parent's fetch is still in flight, then arrives
  // with the real data (and again on every page change / refresh) — without this sync,
  // useState's initializer only fires once and the table would keep showing that first,
  // empty snapshot forever regardless of how many users actually exist.
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  async function handleDelete(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    try {
      await api.delete(`/api/admin/users/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete user");
    }
  }

  async function handleToggleVerified(id: string, verified: boolean) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, verified } : u)));
    try {
      await api.patch(`/api/admin/users/${id}`, { verified });
    } catch (error) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, verified: !verified } : u)));
      toast.error(error instanceof ApiError ? error.message : "Failed to update user");
    }
  }

  return (
    <div>
      <PageHeader title="Users" description="Everyone with access to Pack with Me" action={<UserFormDialog />} />

      {users.length === 0 ? (
        totalUsers > 0 ? (
          <EmptyState
            icon={Users}
            title="No users on this page"
            description={`There ${totalUsers === 1 ? "is" : "are"} ${totalUsers} user${totalUsers === 1 ? "" : "s"} in total — try an earlier page.`}
          />
        ) : (
          <EmptyState
            icon={Users}
            title={isAnonymousTab ? "No anonymous visitors" : "No registered students yet"}
            description={
              isAnonymousTab
                ? "Anonymous accounts appear here the moment someone lands on the site, before they ever register."
                : "Users appear here once they link a mobile number, or once you add one directly."
            }
          />
        )
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {isAnonymousTab ? (
                    <>
                      <TableHead>Device</TableHead>
                      <TableHead>Gender</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Login code</TableHead>
                    </>
                  )}
                  <TableHead>Time on site</TableHead>
                  <TableHead>College / Category</TableHead>
                  {!isAnonymousTab && (
                    <>
                      <TableHead>Role</TableHead>
                      <TableHead>Verified</TableHead>
                    </>
                  )}
                  <TableHead>Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                    {isAnonymousTab ? (
                      <>
                        <TableCell
                          className="text-muted-foreground max-w-[10rem] truncate font-mono text-xs"
                          title={user.deviceId ?? undefined}
                        >
                          {user.deviceId ?? "—"}
                        </TableCell>
                        <TableCell>{user.gender ?? "—"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{user.mobile ? formatMobileForDisplay(user.mobile) : "Not linked"}</TableCell>
                        <TableCell>
                          {user.hasPinSet ? (
                            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
                              <KeyRound className="size-3.5" />
                              Set
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not set</span>
                          )}
                        </TableCell>
                      </>
                    )}
                    <TableCell
                      className="text-muted-foreground"
                      title={user.sessionCount > 0 ? `${user.sessionCount} session${user.sessionCount === 1 ? "" : "s"}` : undefined}
                    >
                      {formatTimeSpent(user.timeSpentSeconds)}
                    </TableCell>
                    <TableCell>
                      {user.college ?? "—"} {user.collegeCategory ? `/ ${user.collegeCategory}` : ""}
                    </TableCell>
                    {!isAnonymousTab && (
                      <>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "accent" : "outline"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleVerified(user.id, !user.verified)}
                          >
                            {user.verified ? <Badge variant="success">Verified</Badge> : "Mark verified"}
                          </Button>
                        </TableCell>
                      </>
                    )}
                    <TableCell>{format(new Date(user.createdAt), "d MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <UserFormDialog
                          user={user}
                          trigger={
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          }
                        />
                        {user.id !== currentUserId && (
                          <ConfirmDialog
                            trigger={
                              <Button variant="outline" size="sm">
                                Delete
                              </Button>
                            }
                            title="Delete this user?"
                            description={`This permanently removes ${user.name ?? (user.mobile ? formatMobileForDisplay(user.mobile) : "this unregistered visitor")} and all of their checklist, budget, notes, documents, contacts, and wishlist data.`}
                            confirmLabel="Delete"
                            onConfirm={() => handleDelete(user.id)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="border-border/60 flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page <= 1 ? (
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`?status=${status}&page=${page - 1}`}>Previous</Link>
                  </Button>
                )}
                {page >= totalPages ? (
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`?status=${status}&page=${page + 1}`}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
