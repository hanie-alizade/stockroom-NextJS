export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => unknown;
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  let str = String(val);

  // Protect against spreadsheet formula injection: = + - @
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // Quote cell if it contains comma, double-quote, newline, or leading single-quote from formula protection
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r") || str.startsWith("'")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function buildCsv<T>(columns: readonly CsvColumn<T>[], rows: readonly T[]): string {
  const headerRow = columns.map((col) => formatCell(col.header)).join(",");
  const dataRows = rows.map((row) =>
    columns.map((col) => formatCell(col.accessor(row))).join(","),
  );

  return [headerRow, ...dataRows].join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
