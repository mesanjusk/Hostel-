import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { listDocuments } from "@/services/documentService";
import { toPlain } from "@/lib/serialize";
import { DocumentsView } from "@/features/documents/documents-view";
import type { DocumentItemDTO } from "@/features/documents/document-dto";

export const metadata: Metadata = { title: "Documents — Hostel Essentials" };

export default async function DocumentsPage() {
  const session = await auth();
  const documents = await listDocuments(session!.user.id);

  const initialDocuments: DocumentItemDTO[] = toPlain(documents).map((d) => ({
    id: d._id,
    title: d.title,
    url: d.url,
    category: d.category,
    createdAt: d.createdAt,
  }));

  return <DocumentsView initialDocuments={initialDocuments} />;
}
