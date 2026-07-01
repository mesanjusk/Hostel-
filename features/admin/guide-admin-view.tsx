"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { GuideFormDialog } from "@/features/admin/guide-form-dialog";
import { deleteGuideArticleAction } from "@/actions/admin";
import type { AdminGuideArticleDTO } from "@/features/admin/guide-admin-dto";

export function GuideAdminView({ articles: initialArticles }: { articles: AdminGuideArticleDTO[] }) {
  const [articles, setArticles] = useState(initialArticles);

  async function handleDelete(id: string) {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    const result = await deleteGuideArticleAction(id);
    if (!result.success) toast.error(result.error);
  }

  return (
    <div>
      <PageHeader
        title="Guide articles"
        description="Manage the hostel survival guide content"
        action={<GuideFormDialog />}
      />

      {articles.length === 0 ? (
        <EmptyState icon={BookOpen} title="No articles yet" description="Add your first guide article." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.category}</TableCell>
                  <TableCell className="text-muted-foreground">/{article.slug}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <GuideFormDialog
                        article={article}
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
                        title="Delete this article?"
                        description="Students will no longer be able to view it."
                        onConfirm={() => handleDelete(article.id)}
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
