import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

interface CategoryGroup {
  category: string;
  items: ChecklistItemDTO[];
}

export function DownloadPdfButton({
  groups,
  overall,
  className,
}: {
  groups: CategoryGroup[];
  overall: { total: number; completed: number };
  className?: string;
}) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);
    try {
      // jsPDF + autotable are only ever needed here, and pull in a sizeable chunk (~150KB
      // gzipped) — load them on demand instead of bloating every checklist page visit.
      const { downloadChecklistPdf } = await import("@/lib/checklist-pdf");
      downloadChecklistPdf(groups, overall, user?.name ?? null);
    } catch {
      toast.error("Couldn't generate the PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating || overall.total === 0}
      className={
        className ??
        "flex shrink-0 items-center gap-1.5 rounded-full border border-[#e9ddc9] bg-white px-3 py-1.5 text-xs font-medium text-[#8a7a6a] transition-colors hover:text-[#3a2e2a] disabled:pointer-events-none disabled:opacity-50"
      }
    >
      {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
      Download PDF
    </button>
  );
}
