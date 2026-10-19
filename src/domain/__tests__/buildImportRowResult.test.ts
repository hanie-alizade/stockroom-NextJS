import { describe, expect, it } from "vitest";
import { buildImportRowResult } from "../importValidation";
import { IMPORT_ACTION, IMPORT_ROW_STATUS } from "@/constants";
import type { ImportRowContext, ImportRowValues } from "@/types";

describe("buildImportRowResult", () => {
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

  it("builds valid result with update action for existing SKU", () => {
    const result = buildImportRowResult(validValues, baseContext);
    expect(result.status).toBe(IMPORT_ROW_STATUS.VALID);
    expect(result.action).toBe(IMPORT_ACTION.UPDATE);
    expect(result.data).toEqual({
      sku: "KL-1001",
      name: "Signature Blend",
      category: "Coffee Beans",
      quantity: 20,
      unitCostSen: 6800,
    });
    expect(result.errors).toEqual([]);
  });

  it("builds valid result with create action for new SKU", () => {
    const result = buildImportRowResult(
      { ...validValues, sku: "NEW-SKU" },
      baseContext,
    );
    expect(result.status).toBe(IMPORT_ROW_STATUS.VALID);
    expect(result.action).toBe(IMPORT_ACTION.CREATE);
    expect(result.data?.sku).toBe("NEW-SKU");
  });

  it("builds invalid result when errors exist", () => {
    const result = buildImportRowResult(
      { ...validValues, quantity: "-2" },
      baseContext,
    );
    expect(result.status).toBe(IMPORT_ROW_STATUS.INVALID);
    expect(result.action).toBeUndefined();
    expect(result.data).toBeUndefined();
    expect(result.errors).toHaveLength(1);
  });
});
