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

export function UsersView({
  users: initialUsers,
  page,
  totalPages,
  totalUsers,
  currentUserId,
}: {
  users: AdminUserDTO[];
  page: number;
  totalPages: number;
  totalUsers: number;
  currentUserId: string | null;
}) {
  const [users, setUsers] = useState(initialUsers);

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
            title="No students yet"
            description="Users appear here after their first login, or once you add one."
          />
        )
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Login code</TableHead>
                <TableHead>College / Category</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                  <TableCell>{formatMobileForDisplay(user.mobile)}</TableCell>
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
                  <TableCell>
                    {user.college ?? "—"} {user.collegeCategory ? `/ ${user.collegeCategory}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "accent" : "outline"}>{user.role}</Badge>
                  </TableCell>
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
                          description={`This permanently removes ${user.name ?? formatMobileForDisplay(user.mobile)} and all of their checklist, budget, notes, documents, contacts, and wishlist data.`}
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
                    <Link to={`/admin/users?page=${page - 1}`}>Previous</Link>
                  </Button>
                )}
                {page >= totalPages ? (
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/admin/users?page=${page + 1}`}>Next</Link>
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
