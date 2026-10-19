import { buildCsv, downloadCsv, type CsvColumn } from "./csv";
import type { ImportRowResult } from "@/types";

interface ErrorCsvRow {
  values: Record<string, string>;
  error: string;
}

/**
 * Builds a CSV string containing only the invalid rows from an import,
 * preserving all original headers and adding an "error" column with
 * all error messages joined by "; ".
 */
export function buildImportErrorsCsv(
  originalHeaders: readonly string[],
  originalRows: readonly Record<string, string>[],
  invalidRows: readonly ImportRowResult[],
): string {
  const columns: CsvColumn<ErrorCsvRow>[] = [
    ...originalHeaders.map((header) => ({
      header,
      accessor: (row: ErrorCsvRow) => row.values[header] ?? "",
    })),
    {
      header: "error",
      accessor: (row: ErrorCsvRow) => row.error,
    },
  ];

  const dataRows: ErrorCsvRow[] = invalidRows
    .filter((inv) => inv.status === "invalid" && inv.errors.length > 0)
    .map((inv) => {
      const originalRow = originalRows[inv.rowNumber - 1] ?? {};
      const errorMessage = inv.errors.map((e) => e.message).join("; ");
      return {
        values: originalRow,
        error: errorMessage,
      };
    });

  return buildCsv(columns, dataRows);
}

/**
 * Derives the error CSV filename: `<original name without .csv>-errors.csv`.
 */
export function getImportErrorsFileName(originalFileName: string): string {
  const baseName = originalFileName.replace(/\.csv$/i, "");
  return `${baseName}-errors.csv`;
}

/**
 * Builds and triggers browser download of the invalid import rows as a CSV file.
 */
export function downloadImportErrors(
  originalFileName: string,
  originalHeaders: readonly string[],
  originalRows: readonly Record<string, string>[],
  invalidRows: readonly ImportRowResult[],
): void {
  const content = buildImportErrorsCsv(originalHeaders, originalRows, invalidRows);
  const fileName = getImportErrorsFileName(originalFileName);
  downloadCsv(fileName, content);
}
