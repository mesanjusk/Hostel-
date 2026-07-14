import { BookMarked } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { CourseFormDialog } from "@/features/admin/course-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { CollegeCategoryDTO, CourseDTO } from "@/features/auth/college-taxonomy-dto";

export function CoursesView({
  courses,
  categories,
  selectedCategoryId,
  onSelectCategory,
}: {
  courses: CourseDTO[];
  categories: CollegeCategoryDTO[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}) {
  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/admin/courses/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete course");
    }
  }

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Specific courses within each college category, used for finer checklist targeting"
        action={<CourseFormDialog categories={categories} defaultCollegeCategoryId={selectedCategoryId || undefined} />}
      />

      <div className="mb-4 max-w-xs">
        <Select value={selectedCategoryId || "all"} onValueChange={(v) => onSelectCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {courses.length === 0 ? (
        <EmptyState icon={BookMarked} title="No courses yet" description="Add your first course." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{categoryNameById.get(course.collegeCategoryId) ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={course.active ? "accent" : "outline"}>{course.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <CourseFormDialog
                        course={course}
                        categories={categories}
                        trigger={
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        }
                      />
                      <ConfirmDialog
                        trigger={
                          <Button variant="outline" size="sm">
                            Delete
                          </Button>
                        }
                        title="Delete this course?"
                        description="Only possible if no checklist items or students reference it — otherwise deactivate it instead."
                        onConfirm={() => handleDelete(course.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
