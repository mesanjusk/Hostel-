/** Minimal RFC4180-ish CSV parser (quoted fields, "" escaped quotes, CRLF/LF) — no library,
 * matching this codebase's "hand-roll CSV instead of adding a dependency" convention (see
 * lib/analytics/export.ts). Handles paste-from-Excel/Sheets output, which is the main source
 * of admin bulk-import CSV. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char === "\r") {
      // Skip — the following \n (or end of text) handles the row break.
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();

  // Drop fully-blank rows (trailing newline, stray blank lines between pasted content).
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Builds and downloads a CSV file client-side — deliberately not shared with
 * lib/analytics/export.ts's exportToCsv, which pulls in jsPDF/autoTable at module scope for
 * its PDF export; importing it here would drag that whole chunk into every page that just
 * wants a lightweight CSV template. */
export function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const lines = [header, ...rows].map((row) => row.map(csvEscape).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
