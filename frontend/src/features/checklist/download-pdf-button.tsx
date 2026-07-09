import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
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
  iconOnly = false,
}: {
  groups: CategoryGroup[];
  overall: { total: number; completed: number };
  className?: string;
  iconOnly?: boolean;
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
      aria-label="Download PDF"
      title="Download PDF"
      className={
        className ??
        cn(
          "flex shrink-0 items-center justify-center border border-[#e9ddc9] bg-white text-[#8a7a6a] transition-colors hover:text-[#3a2e2a] disabled:pointer-events-none disabled:opacity-50",
          iconOnly ? "size-9 rounded-full" : "gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
        )
      }
    >
      {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
      {!iconOnly && "Download PDF"}
    </button>
  );
}
