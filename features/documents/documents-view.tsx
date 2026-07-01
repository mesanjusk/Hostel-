"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentFormDialog } from "@/features/documents/document-form-dialog";
import { deleteDocumentAction } from "@/actions/documents";
import type { DocumentItemDTO } from "@/features/documents/document-dto";

export function DocumentsView({ initialDocuments }: { initialDocuments: DocumentItemDTO[] }) {
  const [documents, setDocuments] = useState(initialDocuments);

  async function handleDelete(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    const result = await deleteDocumentAction(id);
    if (!result.success) toast.error(result.error);
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Keep important links and files within reach"
        action={<DocumentFormDialog />}
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Save links to your Aadhaar, admission letter, or any file you might need in a hurry."
          action={<DocumentFormDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((document, i) => (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="h-full gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <h3 className="font-display line-clamp-1 font-semibold">{document.title}</h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <DocumentFormDialog
                      document={document}
                      trigger={
                        <Button variant="ghost" size="icon" className="size-7">
                          <Pencil className="size-3.5" />
                        </Button>
                      }
                    />
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="size-7">
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                      title="Delete this document?"
                      description="This can't be undone."
                      onConfirm={() => handleDelete(document.id)}
                    />
                  </div>
                </div>
                <div>
                  <Badge variant="secondary">{document.category}</Badge>
                </div>
                <a href={document.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="size-3.5" />
                    Open
                  </Button>
                </a>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
