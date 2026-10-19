import Papa from "papaparse";

export interface ParseCsvOptions {
  preview?: number;
}

export interface ParseCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

/**
 * Parses CSV text using PapaParse with automatic delimiter detection,
 * BOM stripping, header trimming, duplicate header deduplication,
 * and empty line skipping.
 */
export function parseCsv(text: string, options?: ParseCsvOptions): ParseCsvResult {
  // Strip BOM if present
  const cleanedText = text.replace(/^\uFEFF/, "");

  if (cleanedText.trim() === "") {
    return {
      headers: [],
      rows: [],
      rowCount: 0,
    };
  }

  const parsed = Papa.parse<string[]>(cleanedText, {
    header: false,
    skipEmptyLines: "greedy",
    delimitersToGuess: [",", ";", "\t"],
  });

  if (!parsed.data || parsed.data.length === 0) {
    return {
      headers: [],
      rows: [],
      rowCount: 0,
    };
  }

  const rawHeaders = parsed.data[0];
  const seenHeaderCounts = new Map<string, number>();
  const headers: string[] = [];

  for (const raw of rawHeaders) {
    const trimmed = (raw ?? "").trim();
    const count = (seenHeaderCounts.get(trimmed) ?? 0) + 1;
    seenHeaderCounts.set(trimmed, count);

    if (count === 1) {
      headers.push(trimmed);
    } else {
      headers.push(`${trimmed} (${count})`);
    }
  }

  const allRows: Record<string, string>[] = [];
  const dataRows = parsed.data.slice(1);

  for (const row of dataRows) {
    // If a row is completely empty, skip it
    if (!row || row.length === 0 || (row.length === 1 && (row[0] ?? "").trim() === "")) {
      continue;
    }

    const rowObj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const headerName = headers[i];
      rowObj[headerName] = row[i] !== undefined ? String(row[i]).trim() : "";
    }
    allRows.push(rowObj);
  }

  const rowCount = allRows.length;
  const returnedRows =
    options?.preview !== undefined && options.preview >= 0
      ? allRows.slice(0, options.preview)
      : allRows;

  return {
    headers,
    rows: returnedRows,
    rowCount,
  };
}
