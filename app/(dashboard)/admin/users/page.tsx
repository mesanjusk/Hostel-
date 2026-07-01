import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";

import { listUsers } from "@/services/userService";
import { toPlain } from "@/lib/serialize";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

export const metadata: Metadata = { title: "Users — Admin" };

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { users, total } = await listUsers(page, PAGE_SIZE);
  const plain = toPlain(users);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card className="p-0">
      {plain.length === 0 ? (
        <div className="p-6">
          <EmptyState icon={Users} title="No students yet" description="Users appear here after their first login." />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Hostel / Room</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plain.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                  <TableCell>+{user.mobile}</TableCell>
                  <TableCell>{user.college ?? "—"}</TableCell>
                  <TableCell>
                    {user.hostel ?? "—"} {user.roomNumber ? `/ ${user.roomNumber}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "accent" : "outline"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), "d MMM yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
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
                    <Link href={`/admin/users?page=${page - 1}`}>Previous</Link>
                  </Button>
                )}
                {page >= totalPages ? (
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/users?page=${page + 1}`}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
