import { useMemo, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";
import { parseCsv, downloadCsv } from "@/lib/csv";
import { DEFAULT_CHECKLIST_CATEGORIES, type ProductCategory } from "@/types";

const COLUMNS = [
  "name",
  "category",
  "store",
  "price",
  "discountPercent",
  "rating",
  "pros",
  "cons",
  "amazon",
  "flipkart",
  "myntra",
  "decathlon",
  "local",
  "featured",
] as const;

interface BulkProductInput {
  name: string;
  category: ProductCategory;
  store: string;
  price: number;
  discountPercent: number;
  rating: number;
  pros: string[];
  cons: string[];
  buyLinks: { amazon?: string; flipkart?: string; myntra?: string; decathlon?: string; local?: string };
  featured: boolean;
}

interface ParsedRow {
  line: number;
  input?: BulkProductInput;
  error?: string;
}

const CATEGORY_SET = new Set<string>(DEFAULT_CHECKLIST_CATEGORIES);

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseRow(headerIndex: Record<string, number>, cells: string[], line: number): ParsedRow {
  const get = (key: string) => cells[headerIndex[key]]?.trim() ?? "";

  const name = get("name");
  if (!name) return { line, error: "Missing name" };

  const category = get("category");
  if (!CATEGORY_SET.has(category)) {
    return { line, error: `Unknown category "${category}" — must be one of: ${DEFAULT_CHECKLIST_CATEGORIES.join(", ")}` };
  }

  const priceRaw = get("price");
  const price = Number(priceRaw);
  if (!priceRaw || Number.isNaN(price) || price < 0) {
    return { line, error: `Invalid price "${priceRaw}"` };
  }

  const discountPercent = Number(get("discountPercent") || "0");
  const rating = Number(get("rating") || "4");
  const featured = /^(true|yes|1)$/i.test(get("featured"));

  return {
    line,
    input: {
      name,
      category: category as ProductCategory,
      store: get("store") || "Amazon",
      price,
      discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
      rating: Number.isFinite(rating) ? rating : 4,
      pros: splitList(get("pros")),
      cons: splitList(get("cons")),
      buyLinks: {
        amazon: get("amazon") || undefined,
        flipkart: get("flipkart") || undefined,
        myntra: get("myntra") || undefined,
        decathlon: get("decathlon") || undefined,
        local: get("local") || undefined,
      },
      featured,
    },
  };
}

/** Admin "bulk add" for Shopping — paste or upload a CSV (name, category, price, links, ...)
 * and import many products at once, instead of the one-at-a-time ProductFormDialog. Imports
 * upsert by (name, store) server-side, so re-importing an edited CSV is safe. */
export function BulkAddProductsDialog() {
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { rows, validInputs } = useMemo(() => {
    if (!csvText.trim()) return { rows: [] as ParsedRow[], validInputs: [] as BulkProductInput[] };
    const table = parseCsv(csvText);
    if (table.length === 0) return { rows: [] as ParsedRow[], validInputs: [] as BulkProductInput[] };

    const header = table[0].map((h) => h.trim().toLowerCase());
    const headerIndex: Record<string, number> = {};
    header.forEach((h, i) => {
      headerIndex[h] = i;
    });
    if (headerIndex.name === undefined || headerIndex.category === undefined || headerIndex.price === undefined) {
      return {
        rows: [{ line: 1, error: "Header row must include at least: name, category, price" }],
        validInputs: [],
      };
    }

    const parsed = table.slice(1).map((cells, i) => parseRow(headerIndex, cells, i + 2));
    return { rows: parsed, validInputs: parsed.filter((r) => r.input).map((r) => r.input!) };
  }, [csvText]);

  const errorRows = rows.filter((r) => r.error);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function downloadTemplate() {
    downloadCsv("shopping-items-template.csv", [...COLUMNS], [
      [
        "Table Lamp",
        "Hostel Essentials",
        "Amazon",
        "599",
        "0",
        "4",
        "Compact; Easy to carry",
        "Compare listings before buying",
        "https://www.amazon.in/s?k=study+table+lamp",
        "",
        "",
        "",
        "",
        "false",
      ],
    ]);
  }

  async function handleImport() {
    if (validInputs.length === 0) return;
    setImporting(true);
    try {
      const result = await api.post<{ created: number; updated: number }>("/api/admin/products/bulk-import", {
        products: validInputs,
      });
      toast.success(`Imported ${result.created + result.updated} products (${result.created} new, ${result.updated} updated)`);
      emitRefresh();
      setOpen(false);
      setCsvText("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Bulk import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="size-4" /> Bulk add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk add products</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Upload or paste a CSV with columns: <code className="text-xs">{COLUMNS.join(", ")}</code>. Use{" "}
            <code className="text-xs">;</code> to separate multiple pros/cons in one cell.{" "}
            <button type="button" className="text-primary underline" onClick={downloadTemplate}>
              Download a template
            </button>
            .
          </p>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-3.5" /> Upload CSV file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          <Textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="name,category,store,price,discountPercent,rating,pros,cons,amazon,flipkart,myntra,decathlon,local,featured"
            className="min-h-40 font-mono text-xs"
          />

          {csvText.trim() && (
            <div className="text-sm">
              <p>
                <span className="font-medium">{validInputs.length}</span> valid row{validInputs.length === 1 ? "" : "s"} ready to import
                {errorRows.length > 0 && (
                  <>
                    , <span className="text-destructive font-medium">{errorRows.length}</span> skipped
                  </>
                )}
                .
              </p>
              {errorRows.length > 0 && (
                <ScrollArea className="mt-2 max-h-32 rounded-lg border border-border/70 p-2">
                  <ul className="text-destructive flex flex-col gap-0.5 text-xs">
                    {errorRows.map((r) => (
                      <li key={r.line}>
                        Line {r.line}: {r.error}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleImport} disabled={importing || validInputs.length === 0}>
            {importing && <Loader2 className="size-4 animate-spin" />}
            Import {validInputs.length > 0 ? validInputs.length : ""} product{validInputs.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
