import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

interface CategoryGroup {
  category: string;
  items: ChecklistItemDTO[];
}

interface OverallProgress {
  total: number;
  completed: number;
}

function formatPrice(item: ChecklistItemDTO): string {
  if (item.price != null) return `Rs ${item.price}`;
  if (item.priceRangeMin != null && item.priceRangeMax != null) {
    return `Rs ${item.priceRangeMin}-${item.priceRangeMax}`;
  }
  return "";
}

/** Builds and downloads a PDF snapshot of the checklist — one table per category, with the
 * same packed/priority/price info shown in the app. Entirely client-side, no server round trip. */
export function downloadChecklistPdf(groups: CategoryGroup[], overall: OverallProgress, studentName?: string | null) {
  const doc = new jsPDF({ unit: "pt" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Pack with Me — Packing Checklist", marginX, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  const subtitle = studentName ? `${studentName} — generated ${new Date().toLocaleDateString()}` : `Generated ${new Date().toLocaleDateString()}`;
  doc.text(subtitle, marginX, 62);

  const percent = overall.total > 0 ? Math.round((overall.completed / overall.total) * 100) : 0;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text(`Overall progress: ${overall.completed}/${overall.total} packed (${percent}%)`, marginX, 82);

  let cursorY = 100;

  for (const group of groups) {
    if (group.items.length === 0) continue;

    const completed = group.items.filter((i) => i.completed).length;

    if (cursorY > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      cursorY = 40;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(`${group.category} (${completed}/${group.items.length})`, marginX, cursorY);

    autoTable(doc, {
      startY: cursorY + 10,
      margin: { left: marginX, right: marginX },
      head: [["Packed", "Item", "Priority", "Price"]],
      body: group.items.map((item) => [
        item.completed ? "Yes" : "",
        item.item,
        item.priority,
        formatPrice(item),
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [201, 107, 154], textColor: 255 },
      alternateRowStyles: { fillColor: [253, 246, 238] },
      theme: "grid",
    });

    const { finalY } = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
    cursorY = finalY + 28;
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Pack with Me", pageWidth - marginX, doc.internal.pageSize.getHeight() - 20, { align: "right" });

  doc.save(`pack-with-me-checklist-${new Date().toISOString().slice(0, 10)}.pdf`);
}
