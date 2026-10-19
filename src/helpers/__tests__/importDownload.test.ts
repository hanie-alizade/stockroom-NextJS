import { describe, expect, it } from "vitest";
import {
  buildImportErrorsCsv,
  getImportErrorsFileName,
  getImportSkippedFileName,
} from "../importDownload";
import type { ImportRowResult } from "@/types";

describe("importDownload helpers", () => {
  describe("getImportErrorsFileName and getImportSkippedFileName", () => {
    it("strips .csv extension and appends -errors.csv", () => {
      expect(getImportErrorsFileName("kopi-lane-stock.csv")).toBe(
        "kopi-lane-stock-errors.csv",
      );
      expect(getImportErrorsFileName("UPPERCASE.CSV")).toBe(
        "UPPERCASE-errors.csv",
      );
      expect(getImportErrorsFileName("no-extension")).toBe(
        "no-extension-errors.csv",
      );
    });

    it("strips .csv extension and appends -skipped.csv", () => {
      expect(getImportSkippedFileName("kopi-lane-stock.csv")).toBe(
        "kopi-lane-stock-skipped.csv",
      );
      expect(getImportSkippedFileName("data.CSV")).toBe("data-skipped.csv");
    });
  });

  describe("buildImportErrorsCsv", () => {
    const headers = ["Item code", "Description", "Qty", "Cost (RM)"];
    const originalRows = [
      {
        "Item code": "KL-1001",
        Description: "Arabica beans",
        Qty: "10",
        "Cost (RM)": "50.00",
      },
      {
        "Item code": "BAD-1",
        Description: "Bad Item",
        Qty: "-5",
        "Cost (RM)": "thirty",
      },
      {
        "Item code": "KL-1002",
        Description: "Robusta beans",
        Qty: "20",
        "Cost (RM)": "40.00",
      },
      {
        "Item code": "",
        Description: "Missing SKU",
        Qty: "15",
        "Cost (RM)": "25.00",
      },
    ];

    it("outputs only invalid rows with their original columns and error messages joined by semicolon", () => {
      const invalidRows: ImportRowResult[] = [
        {
          rowNumber: 2,
          status: "invalid",
          values: {
            sku: "BAD-1",
            name: "Bad Item",
            category: "Coffee",
            quantity: "-5",
            unitCost: "thirty",
          },
          errors: [
            {
              code: "INVALID_QUANTITY",
              field: "quantity",
              message: "Quantity can't be negative",
            },
            {
              code: "INVALID_UNIT_COST",
              field: "unitCost",
              message: "Unit cost isn't a number",
            },
          ],
        },
        {
          rowNumber: 4,
          status: "invalid",
          values: {
            sku: "",
            name: "Missing SKU",
            category: "Coffee",
            quantity: "15",
            unitCost: "25.00",
          },
          errors: [
            {
              code: "MISSING_REQUIRED",
              field: "sku",
              message: "SKU is missing",
            },
          ],
        },
      ];

      const csv = buildImportErrorsCsv(headers, originalRows, invalidRows);
      const lines = csv.split("\r\n");

      expect(lines[0]).toBe("Item code,Description,Qty,Cost (RM),error");
      expect(lines).toHaveLength(3); // header + 2 invalid rows
      expect(lines[1]).toBe(
        'BAD-1,Bad Item,"\'--5",thirty,Quantity can\'t be negative; Unit cost isn\'t a number'.replace(
          "'--5",
          "'-5",
        ),
      );
      expect(lines[2]).toBe(',Missing SKU,15,25.00,SKU is missing');
    });

    it("handles formula protection correctly", () => {
      const headersWithFormula = ["Code", "Name"];
      const rows = [{ Code: "=SUM(A1:B1)", Name: "@admin" }];
      const invalidRows: ImportRowResult[] = [
        {
          rowNumber: 1,
          status: "invalid",
          values: {
            sku: "=SUM(A1:B1)",
            name: "@admin",
            category: "Coffee",
            quantity: "1",
            unitCost: "1.00",
          },
          errors: [
            {
              code: "INVALID_SKU",
              field: "sku",
              message: "Invalid SKU",
            },
          ],
        },
      ];

      const csv = buildImportErrorsCsv(headersWithFormula, rows, invalidRows);
      const lines = csv.split("\r\n");

      expect(lines[1]).toContain('"\'=SUM(A1:B1)"');
      expect(lines[1]).toContain('"\'@admin"');
    });

    it("supports commit.skippedRows without status property", () => {
      const headers = ["Item code", "Description", "Qty"];
      const rows = [
        { "Item code": "SKU-1", Description: "Item 1", Qty: "5" },
        { "Item code": "SKU-2", Description: "Item 2", Qty: "10" },
      ];
      const skippedRows = [
        {
          rowNumber: 2,
          errors: [
            {
              code: "INVALID_QUANTITY" as const,
              field: "quantity" as const,
              message: "Quantity can't be negative",
            },
          ],
        },
      ];

      const csv = buildImportErrorsCsv(headers, rows, skippedRows);
      const lines = csv.split("\r\n");
      expect(lines[0]).toBe("Item code,Description,Qty,error");
      expect(lines).toHaveLength(2);
      expect(lines[1]).toBe("SKU-2,Item 2,10,Quantity can't be negative");
    });
  });
});
