import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ChecklistTemplateFormDialog } from "@/features/admin/checklist-template-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import type { ChecklistTemplateDTO } from "@/features/admin/checklist-template-dto";

export function ChecklistTemplatesView({ templates }: { templates: ChecklistTemplateDTO[] }) {
  async function activate(id: string) {
    try {
      await api.patch(`/api/admin/checklist-templates/${id}`, { active: true, published: true });
      emitRefresh();
      toast.success("Template activated — new checklist generation now uses it");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to activate template");
    }
  }

  return (
    <div>
      <PageHeader
        title="Checklist Templates"
        description="Only one template is ever active — that's the one checklist generation reads from"
        action={<ChecklistTemplateFormDialog />}
      />

      {templates.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No templates yet" description="Create the default template." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>v{template.version}</TableCell>
                  <TableCell>
                    {template.active ? (
                      <Badge variant="accent">Active</Badge>
                    ) : template.published ? (
                      <Badge variant="outline">Published</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {!template.active && (
                        <Button variant="outline" size="sm" onClick={() => activate(template.id)}>
                          Activate
                        </Button>
                      )}
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
