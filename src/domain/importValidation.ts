import {
  IMPORT_ACTION,
  IMPORT_ERROR_CODE,
  IMPORT_FIELD,
  IMPORT_LIMITS,
  IMPORT_ROW_MESSAGE,
  IMPORT_ROW_STATUS,
} from "@/constants";
import { parseMoneyToSen } from "@/helpers";
import type {
  ImportRowContext,
  ImportRowError,
  ImportRowResult,
  ImportRowValues,
} from "@/types";

/**
 * Normalizes a SKU by trimming whitespace and converting to uppercase.
 */
export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

/**
 * Searches for a category name case-insensitively.
 * Returns the canonical category name from the list, or null if not found.
 */
export function findCategory(
  categories: readonly string[],
  name: string,
): string | null {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return null;
  const match = categories.find((c) => c.trim().toLowerCase() === trimmed);
  return match ?? null;
}

/**
 * Validates a single import row and returns all errors encountered
 * in the strict specification order.
 */
export function validateImportRow(
  values: ImportRowValues,
  context: ImportRowContext,
): ImportRowError[] {
  const errors: ImportRowError[] = [];

  const rawSku = values.sku ?? "";
  const rawName = values.name ?? "";
  const rawCategory = values.category ?? "";
  const rawQuantity = values.quantity ?? "";
  const rawUnitCost = values.unitCost ?? "";

  const trimmedSku = rawSku.trim();
  const trimmedName = rawName.trim();
  const trimmedCategory = rawCategory.trim();
  const trimmedQuantity = rawQuantity.trim();
  const trimmedUnitCost = rawUnitCost.trim();

  // 1. MISSING_REQUIRED (sku, name, category, quantity, unitCost)
  if (!trimmedSku) {
    errors.push({
      code: IMPORT_ERROR_CODE.MISSING_REQUIRED,
      field: IMPORT_FIELD.SKU,
      message: IMPORT_ROW_MESSAGE.SKU_MISSING,
    });
  }
  if (!trimmedName) {
    errors.push({
      code: IMPORT_ERROR_CODE.MISSING_REQUIRED,
      field: IMPORT_FIELD.NAME,
      message: IMPORT_ROW_MESSAGE.NAME_MISSING,
    });
  }
  if (!trimmedCategory) {
    errors.push({
      code: IMPORT_ERROR_CODE.MISSING_REQUIRED,
      field: IMPORT_FIELD.CATEGORY,
      message: IMPORT_ROW_MESSAGE.CATEGORY_MISSING,
    });
  }
  if (!trimmedQuantity) {
    errors.push({
      code: IMPORT_ERROR_CODE.MISSING_REQUIRED,
      field: IMPORT_FIELD.QUANTITY,
      message: IMPORT_ROW_MESSAGE.QUANTITY_MISSING,
    });
  }
  if (!trimmedUnitCost) {
    errors.push({
      code: IMPORT_ERROR_CODE.MISSING_REQUIRED,
      field: IMPORT_FIELD.UNIT_COST,
      message: IMPORT_ROW_MESSAGE.UNIT_COST_MISSING,
    });
  }

  // 2. INVALID_SKU
  const normalizedSku = normalizeSku(trimmedSku);
  if (trimmedSku) {
    if (normalizedSku.length > IMPORT_LIMITS.maxSkuLength) {
      errors.push({
        code: IMPORT_ERROR_CODE.INVALID_SKU,
        field: IMPORT_FIELD.SKU,
        message: "SKU is too long",
      });
    } else if (!/^[A-Z0-9.-]+$/i.test(normalizedSku)) {
      errors.push({
        code: IMPORT_ERROR_CODE.INVALID_SKU,
        field: IMPORT_FIELD.SKU,
        message: IMPORT_ROW_MESSAGE.SKU_INVALID_CHARS,
      });
    }
  }

  // 3. NAME_TOO_LONG
  if (trimmedName && trimmedName.length > IMPORT_LIMITS.maxNameLength) {
    errors.push({
      code: IMPORT_ERROR_CODE.NAME_TOO_LONG,
      field: IMPORT_FIELD.NAME,
      message: IMPORT_ROW_MESSAGE.NAME_TOO_LONG,
    });
  }

  // 4. INVALID_QUANTITY
  if (trimmedQuantity) {
    if (trimmedQuantity.startsWith("-") || trimmedQuantity.includes("-")) {
      errors.push({
        code: IMPORT_ERROR_CODE.INVALID_QUANTITY,
        field: IMPORT_FIELD.QUANTITY,
        message: IMPORT_ROW_MESSAGE.QUANTITY_NEGATIVE,
      });
    } else if (!/^\d+$/.test(trimmedQuantity)) {
      errors.push({
        code: IMPORT_ERROR_CODE.INVALID_QUANTITY,
        field: IMPORT_FIELD.QUANTITY,
        message: IMPORT_ROW_MESSAGE.QUANTITY_NOT_WHOLE,
      });
    }
  }

  // 5. INVALID_UNIT_COST
  if (trimmedUnitCost) {
    if (trimmedUnitCost.startsWith("-") || trimmedUnitCost.includes("-")) {
      errors.push({
        code: IMPORT_ERROR_CODE.INVALID_UNIT_COST,
        field: IMPORT_FIELD.UNIT_COST,
        message: IMPORT_ROW_MESSAGE.UNIT_COST_NEGATIVE,
      });
    } else if (/\.\d{3,}/.test(trimmedUnitCost)) {
      errors.push({
        code: IMPORT_ERROR_CODE.INVALID_UNIT_COST,
        field: IMPORT_FIELD.UNIT_COST,
        message: IMPORT_ROW_MESSAGE.UNIT_COST_DECIMALS,
      });
    } else if (parseMoneyToSen(trimmedUnitCost) === null) {
      errors.push({
        code: IMPORT_ERROR_CODE.INVALID_UNIT_COST,
        field: IMPORT_FIELD.UNIT_COST,
        message: IMPORT_ROW_MESSAGE.UNIT_COST_NOT_A_NUMBER,
      });
    }
  }

  // 6. UNKNOWN_CATEGORY
  if (trimmedCategory) {
    const matchedCategory = findCategory(context.categories, trimmedCategory);
    if (!matchedCategory) {
      errors.push({
        code: IMPORT_ERROR_CODE.UNKNOWN_CATEGORY,
        field: IMPORT_FIELD.CATEGORY,
        message: IMPORT_ROW_MESSAGE.UNKNOWN_CATEGORY(trimmedCategory),
      });
    }
  }

  // 7. DUPLICATE_SKU_IN_FILE
  if (context.duplicateOfRow !== undefined) {
    errors.push({
      code: IMPORT_ERROR_CODE.DUPLICATE_SKU_IN_FILE,
      field: IMPORT_FIELD.SKU,
      message: IMPORT_ROW_MESSAGE.SAME_SKU(context.duplicateOfRow),
    });
  }

  return errors;
}

/**
 * Builds a complete ImportRowResult for a mapped row, computing parsed
 * data and create/update action when valid.
 */
export function buildImportRowResult(
  values: ImportRowValues,
  context: ImportRowContext,
): ImportRowResult {
  const errors = validateImportRow(values, context);

  if (errors.length > 0) {
    return {
      rowNumber: context.rowNumber,
      status: IMPORT_ROW_STATUS.INVALID,
      values,
      errors,
    };
  }

  const normalizedSku = normalizeSku(values.sku);
  const canonicalCategory = findCategory(context.categories, values.category)!;
  const quantity = Number.parseInt(values.quantity.trim(), 10);
  const unitCostSen = parseMoneyToSen(values.unitCost)!;
  const isExisting = context.existingSkus.has(normalizedSku);

  return {
    rowNumber: context.rowNumber,
    status: IMPORT_ROW_STATUS.VALID,
    action: isExisting ? IMPORT_ACTION.UPDATE : IMPORT_ACTION.CREATE,
    values,
    data: {
      sku: normalizedSku,
      name: values.name.trim(),
      category: canonicalCategory,
      quantity,
      unitCostSen,
    },
    errors: [],
  };
}
