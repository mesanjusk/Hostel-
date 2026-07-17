import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { CollegeFormDialog } from "@/features/admin/college-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { CityOptionDTO, CollegeCategoryDTO, CollegeDTO } from "@/features/auth/college-taxonomy-dto";

export function CollegesView({
  colleges,
  cities,
  categories,
  selectedCity,
  selectedCategoryId,
  onSelectCity,
  onSelectCategory,
}: {
  colleges: CollegeDTO[];
  cities: CityOptionDTO[];
  categories: CollegeCategoryDTO[];
  selectedCity: string;
  selectedCategoryId: string;
  onSelectCity: (city: string) => void;
  onSelectCategory: (id: string) => void;
}) {
  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/admin/colleges/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete college");
    }
  }

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      <PageHeader
        title="Colleges"
        description="Curated, city + category shortlist (best NIRF rank first) that powers the onboarding college picker"
        action={
          <CollegeFormDialog
            cities={cities}
            categories={categories}
            defaultCity={selectedCity || undefined}
            defaultCollegeCategoryId={selectedCategoryId || undefined}
          />
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-full max-w-xs">
          <Select value={selectedCity || "all"} onValueChange={(v) => onSelectCity(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full max-w-xs">
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
      </div>

      {colleges.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No colleges yet" description="Add your first college." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>NIRF rank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {colleges.map((college) => (
                <TableRow key={college.id}>
                  <TableCell className="font-medium">{college.name}</TableCell>
                  <TableCell>{college.city}</TableCell>
                  <TableCell>{categoryNameById.get(college.collegeCategoryId) ?? "—"}</TableCell>
                  <TableCell>{college.nirfRank ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={college.active ? "accent" : "outline"}>
                      {college.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <CollegeFormDialog
                        college={college}
                        cities={cities}
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
                        title="Delete this college?"
                        description="Only possible if no students reference it — otherwise deactivate it instead."
                        onConfirm={() => handleDelete(college.id)}
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
