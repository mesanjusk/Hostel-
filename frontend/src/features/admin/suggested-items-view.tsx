import { Lightbulb } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { AddSuggestedToDefaultDialog } from "@/features/admin/add-suggested-to-default-dialog";
import type { SuggestedItemDTO } from "@/features/admin/suggested-item-dto";

export function SuggestedItemsView({ suggestions }: { suggestions: SuggestedItemDTO[] }) {
  return (
    <div>
      <PageHeader
        title="Suggested Items"
        description="Items students added themselves that aren't in the master catalog yet — promote the popular ones"
      />

      {suggestions.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No suggestions yet" description="Nothing to promote right now." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Users using</TableHead>
                <TableHead>Completion %</TableHead>
                <TableHead>Most popular category</TableHead>
                <TableHead>Most popular course</TableHead>
                <TableHead>First added</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((s) => (
                <TableRow key={s.key}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.category}</TableCell>
                  <TableCell>{s.usersUsing}</TableCell>
                  <TableCell>{s.completionPercent}%</TableCell>
                  <TableCell>{s.mostPopularCollegeCategory ?? "—"}</TableCell>
                  <TableCell>{s.mostPopularCourse ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(s.firstAdded).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(s.lastUsed).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <AddSuggestedToDefaultDialog suggestion={s} />
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
