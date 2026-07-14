import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";

interface ParsedRow {
  category: string;
  title: string;
  priority?: "low" | "medium" | "high";
  estimatedPrice?: number;
}

/** One item per line: "Category | Title | priority | price" — priority and price are optional. */
function parseRows(text: string): ParsedRow[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [category, title, priority, price] = line.split("|").map((part) => part.trim());
      const row: ParsedRow = { category: category ?? "", title: title ?? "" };
      if (priority === "low" || priority === "medium" || priority === "high") row.priority = priority;
      if (price && !Number.isNaN(Number(price))) row.estimatedPrice = Number(price);
      return row;
    })
    .filter((row) => row.category && row.title);
}

export function BulkImportDefaultItemsDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rows = parseRows(text);

  async function handleImport() {
    if (rows.length === 0) {
      toast.error("Nothing to import — add at least one valid row");
      return;
    }
    setIsSubmitting(true);
    try {
      const { imported, skipped } = await api.post<{ imported: number; skipped: number }>(
        "/api/admin/default-checklist-items/bulk-import",
        { rows },
      );
      emitRefresh();
      toast.success(`Imported ${imported} item(s)${skipped > 0 ? `, skipped ${skipped} duplicate(s)` : ""}`);
      setText("");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Bulk import failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="size-4" />
          Bulk import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk import checklist items</DialogTitle>
          <DialogDescription>
            One item per line: <code>Category | Title | priority | price</code> — priority and price are optional.
            Applies to all college categories/courses; edit individually afterward to narrow targeting.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Documents | ID Proof | high\nClothes | T-Shirts | high | 500"}
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-muted-foreground text-sm">{rows.length} row(s) detected</p>
        <DialogFooter>
          <Button onClick={handleImport} disabled={isSubmitting || rows.length === 0}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Import {rows.length > 0 ? rows.length : ""} item(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
