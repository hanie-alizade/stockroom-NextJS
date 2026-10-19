import { describe, expect, it } from "vitest";
import { autoMatchColumns } from "../importMapping";

describe("autoMatchColumns", () => {
  it("matches standard Stockroom headers", () => {
    const headers = ["SKU", "Name", "Category", "Quantity", "Unit cost"];
    const mapping = autoMatchColumns(headers);
    expect(mapping).toEqual({
      sku: "SKU",
      name: "Name",
      category: "Category",
      quantity: "Quantity",
      unitCost: "Unit cost",
    });
  });

  it("matches aliases from docs/IMPORT.md example", () => {
    const headers = [
      "Item code",
      "Description",
      "Group",
      "Qty",
      "Cost (RM)",
      "Barcode",
      "Supplier",
    ];
    const mapping = autoMatchColumns(headers);
    expect(mapping).toEqual({
      sku: "Item code",
      name: "Description",
      category: "Group",
      quantity: "Qty",
      unitCost: "Cost (RM)",
    });
  });

  it("falls back to ignoring brackets when full name does not match first", () => {
    const headers = ["item_sku", "product-name", "type", "stock", "Price ($ USD)"];
    const mapping = autoMatchColumns(headers);
    expect(mapping).toEqual({
      sku: "item_sku",
      name: "product-name",
      category: "type",
      quantity: "stock",
      unitCost: "Price ($ USD)",
    });
  });

  it("ensures each field and column is used at most once", () => {
    // Both 'code' and 'sku' map to SKU, but first one seen wins
    const headers = ["Code", "SKU", "Name", "Category", "Quantity", "Unit Cost"];
    const mapping = autoMatchColumns(headers);
    expect(mapping.sku).toBe("Code");
    expect(Object.values(mapping)).not.toContain("SKU");
  });

  it("returns partial mapping when some required fields are not present", () => {
    const headers = ["SKU", "Name", "Unknown Col"];
    const mapping = autoMatchColumns(headers);
    expect(mapping).toEqual({
      sku: "SKU",
      name: "Name",
    });
  });
});
