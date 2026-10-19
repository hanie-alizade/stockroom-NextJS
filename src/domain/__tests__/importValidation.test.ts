import { describe, expect, it } from "vitest";
import {
  findCategory,
  normalizeSku,
  validateImportRow,
} from "../importValidation";
import { IMPORT_ERROR_CODE } from "@/constants";
import type { ImportRowContext, ImportRowValues } from "@/types";

describe("importValidation domain", () => {
  const categories = ["Coffee Beans", "Dairy", "Syrups", "Pastries"];
  const existingSkus = new Set(["KL-1001", "KL-1002"]);

  const baseContext: ImportRowContext = {
    rowNumber: 1,
    categories,
    existingSkus,
  };

  const validValues: ImportRowValues = {
    sku: "KL-1001",
    name: "Signature Blend",
    category: "Coffee Beans",
    quantity: "20",
    unitCost: "68.00",
  };

  describe("normalizeSku", () => {
    it("trims and converts to uppercase", () => {
      expect(normalizeSku("  kl-1001  ")).toBe("KL-1001");
      expect(normalizeSku("abc.123-x")).toBe("ABC.123-X");
    });
  });

  describe("findCategory", () => {
    it("matches case-insensitively and returns canonical name", () => {
      expect(findCategory(categories, "coffee beans")).toBe("Coffee Beans");
      expect(findCategory(categories, "  DAIRY  ")).toBe("Dairy");
      expect(findCategory(categories, "syrups")).toBe("Syrups");
    });

    it("returns null for unknown or empty categories", () => {
      expect(findCategory(categories, "Snacks")).toBeNull();
      expect(findCategory(categories, "")).toBeNull();
      expect(findCategory(categories, "   ")).toBeNull();
    });
  });

  describe("validateImportRow - individual error codes", () => {
    it("reports MISSING_REQUIRED for empty fields", () => {
      const values: ImportRowValues = {
        sku: "  ",
        name: "",
        category: "",
        quantity: "",
        unitCost: "",
      };
      const errors = validateImportRow(values, baseContext);
      expect(errors).toHaveLength(5);
      expect(errors.map((e) => e.code)).toEqual([
        IMPORT_ERROR_CODE.MISSING_REQUIRED,
        IMPORT_ERROR_CODE.MISSING_REQUIRED,
        IMPORT_ERROR_CODE.MISSING_REQUIRED,
        IMPORT_ERROR_CODE.MISSING_REQUIRED,
        IMPORT_ERROR_CODE.MISSING_REQUIRED,
      ]);
      expect(errors.map((e) => e.field)).toEqual([
        "sku",
        "name",
        "category",
        "quantity",
        "unitCost",
      ]);
    });

    it("reports INVALID_SKU for invalid characters or exceeding max length", () => {
      const invalidChars = validateImportRow(
        { ...validValues, sku: "KL@#123" },
        baseContext,
      );
      expect(invalidChars).toEqual([
        {
          code: IMPORT_ERROR_CODE.INVALID_SKU,
          field: "sku",
          message: "SKU can only use letters, numbers, dots and dashes",
        },
      ]);

      const tooLong = validateImportRow(
        { ...validValues, sku: "A".repeat(33) },
        baseContext,
      );
      expect(tooLong).toEqual([
        {
          code: IMPORT_ERROR_CODE.INVALID_SKU,
          field: "sku",
          message: "SKU is too long",
        },
      ]);
    });

    it("reports NAME_TOO_LONG when name exceeds 120 characters", () => {
      const errors = validateImportRow(
        { ...validValues, name: "A".repeat(121) },
        baseContext,
      );
      expect(errors).toEqual([
        {
          code: IMPORT_ERROR_CODE.NAME_TOO_LONG,
          field: "name",
          message: "Name is too long",
        },
      ]);
    });

    it("reports INVALID_QUANTITY for negative, decimal, or non-numeric values", () => {
      const negative = validateImportRow(
        { ...validValues, quantity: "-5" },
        baseContext,
      );
      expect(negative).toEqual([
        {
          code: IMPORT_ERROR_CODE.INVALID_QUANTITY,
          field: "quantity",
          message: "Quantity can't be negative",
        },
      ]);

      const decimal = validateImportRow(
        { ...validValues, quantity: "12.5" },
        baseContext,
      );
      expect(decimal).toEqual([
        {
          code: IMPORT_ERROR_CODE.INVALID_QUANTITY,
          field: "quantity",
          message: "Quantity must be a whole number",
        },
      ]);

      const words = validateImportRow(
        { ...validValues, quantity: "ten" },
        baseContext,
      );
      expect(words).toEqual([
        {
          code: IMPORT_ERROR_CODE.INVALID_QUANTITY,
          field: "quantity",
          message: "Quantity must be a whole number",
        },
      ]);
    });

    it("reports INVALID_UNIT_COST for negative, >2 decimals, or non-number", () => {
      const negative = validateImportRow(
        { ...validValues, unitCost: "-10.00" },
        baseContext,
      );
      expect(negative).toEqual([
        {
          code: IMPORT_ERROR_CODE.INVALID_UNIT_COST,
          field: "unitCost",
          message: "Unit cost can't be negative",
        },
      ]);

      const decimals = validateImportRow(
        { ...validValues, unitCost: "12.345" },
        baseContext,
      );
      expect(decimals).toEqual([
        {
          code: IMPORT_ERROR_CODE.INVALID_UNIT_COST,
          field: "unitCost",
          message: "Unit cost can have at most 2 decimals",
        },
      ]);

      const words = validateImportRow(
        { ...validValues, unitCost: "thirty" },
        baseContext,
      );
      expect(words).toEqual([
        {
          code: IMPORT_ERROR_CODE.INVALID_UNIT_COST,
          field: "unitCost",
          message: "Unit cost isn't a number",
        },
      ]);
    });

    it("reports UNKNOWN_CATEGORY when category does not exist", () => {
      const errors = validateImportRow(
        { ...validValues, category: "Snacks" },
        baseContext,
      );
      expect(errors).toEqual([
        {
          code: IMPORT_ERROR_CODE.UNKNOWN_CATEGORY,
          field: "category",
          message: 'Category "Snacks" doesn\'t exist',
        },
      ]);
    });

    it("reports DUPLICATE_SKU_IN_FILE with first row number", () => {
      const contextWithDuplicate: ImportRowContext = {
        ...baseContext,
        rowNumber: 5,
        duplicateOfRow: 2,
      };
      const errors = validateImportRow(validValues, contextWithDuplicate);
      expect(errors).toEqual([
        {
          code: IMPORT_ERROR_CODE.DUPLICATE_SKU_IN_FILE,
          field: "sku",
          message: "Same SKU as row 2",
        },
      ]);
    });
  });

  describe("error order and multiple errors on one row", () => {
    it("returns errors in strict specification order", () => {
      // Row with:
      // INVALID_SKU (chars)
      // NAME_TOO_LONG (>120)
      // INVALID_QUANTITY (-1)
      // INVALID_UNIT_COST (not a number)
      // UNKNOWN_CATEGORY (unknown)
      // DUPLICATE_SKU_IN_FILE (duplicateOfRow: 1)
      const values: ImportRowValues = {
        sku: "BAD*SKU",
        name: "N".repeat(125),
        category: "Unknown Cat",
        quantity: "-10",
        unitCost: "free",
      };
      const ctx: ImportRowContext = {
        rowNumber: 4,
        categories,
        existingSkus,
        duplicateOfRow: 1,
      };
      const errors = validateImportRow(values, ctx);
      expect(errors.map((e) => e.code)).toEqual([
        IMPORT_ERROR_CODE.INVALID_SKU,
        IMPORT_ERROR_CODE.NAME_TOO_LONG,
        IMPORT_ERROR_CODE.INVALID_QUANTITY,
        IMPORT_ERROR_CODE.INVALID_UNIT_COST,
        IMPORT_ERROR_CODE.UNKNOWN_CATEGORY,
        IMPORT_ERROR_CODE.DUPLICATE_SKU_IN_FILE,
      ]);
    });
  });
});
