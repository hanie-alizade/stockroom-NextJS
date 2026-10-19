import "server-only";

import {
  IMPORT_ACTION,
  IMPORT_FIELD,
  IMPORT_ROW_STATUS,
} from "@/constants";
import { buildImportRowResult, normalizeSku } from "@/domain";
import { parseCsv } from "@/helpers";
import type { Repository } from "@/server/repositories";
import type {
  ImportRowResult,
  ImportRowValues,
  ImportValidationResult,
} from "@/types";
import type { ImportFileInput } from "./types";

/**
 * Validates a parsed CSV against repository categories and existing products.
 * Does not mutate any repository state. Row numbers start at 1 for the first data row.
 */
export function validateImport(
  repo: Repository,
  input: ImportFileInput,
): ImportValidationResult {
  const categories = repo.getCategories().map((c) => c.name);
  const existingProducts = repo.listProducts();
  const existingSkus = new Set(existingProducts.map((p) => p.sku));

  const { rows } = parseCsv(input.fileText);
  const rowResults: ImportRowResult[] = [];
  const firstSeenRowBySku = new Map<string, number>();

  let valid = 0;
  let invalid = 0;
  let willCreate = 0;
  let willUpdate = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 1;
    const row = rows[i];

    const values: ImportRowValues = {
      [IMPORT_FIELD.SKU]: row[input.mapping.sku ?? ""] ?? "",
      [IMPORT_FIELD.NAME]: row[input.mapping.name ?? ""] ?? "",
      [IMPORT_FIELD.CATEGORY]: row[input.mapping.category ?? ""] ?? "",
      [IMPORT_FIELD.QUANTITY]: row[input.mapping.quantity ?? ""] ?? "",
      [IMPORT_FIELD.UNIT_COST]: row[input.mapping.unitCost ?? ""] ?? "",
    };

    const trimmedSku = values.sku.trim();
    let duplicateOfRow: number | undefined;

    if (trimmedSku) {
      const normalizedSku = normalizeSku(trimmedSku);
      const prev = firstSeenRowBySku.get(normalizedSku);
      if (prev !== undefined) {
        duplicateOfRow = prev;
      } else {
        firstSeenRowBySku.set(normalizedSku, rowNumber);
      }
    }

    const rowResult = buildImportRowResult(values, {
      rowNumber,
      categories,
      existingSkus,
      duplicateOfRow,
    });

    if (rowResult.status === IMPORT_ROW_STATUS.VALID) {
      valid++;
      if (rowResult.action === IMPORT_ACTION.CREATE) {
        willCreate++;
      } else if (rowResult.action === IMPORT_ACTION.UPDATE) {
        willUpdate++;
      }
    } else {
      invalid++;
    }

    rowResults.push(rowResult);
  }

  return {
    summary: {
      total: rows.length,
      valid,
      invalid,
      willCreate,
      willUpdate,
    },
    rows: rowResults,
  };
}
