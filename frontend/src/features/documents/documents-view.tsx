import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentFormDialog } from "@/features/documents/document-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh, subscribeRefresh } from "@/lib/refresh-bus";
import {
  toDocumentItemDTO,
  type DocumentItemDTO,
  type DocumentItemRaw,
} from "@/features/documents/document-dto";

export function DocumentsView() {
  const [documents, setDocuments] = useState<DocumentItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const { documents: raw } = await api.get<{ documents: DocumentItemRaw[] }>("/api/documents");
      setDocuments(raw.map(toDocumentItemDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  async function handleDelete(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await api.delete(`/api/documents/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete document");
      fetchData();
    }
  }

  return (
    <div>
      <PageHeader title="Documents" description="Keep important links and files within reach" />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Tap the + button below to save links to your Aadhaar, admission letter, or any file you might need in a hurry."
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
                        <Button variant="ghost" size="icon" className="size-7" aria-label="Edit document">
                          <Pencil className="size-3.5" />
                        </Button>
                      }
                    />
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="size-7" aria-label="Delete document">
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
