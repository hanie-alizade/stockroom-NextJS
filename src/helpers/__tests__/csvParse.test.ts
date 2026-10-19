import { describe, expect, it } from "vitest";
import { parseCsv } from "../csvParse";

describe("parseCsv", () => {
  it("handles empty files and whitespace-only text", () => {
    expect(parseCsv("")).toEqual({ headers: [], rows: [], rowCount: 0 });
    expect(parseCsv("   \n\n  \r\n  ")).toEqual({ headers: [], rows: [], rowCount: 0 });
  });

  it("strips BOM character from beginning of text", () => {
    const csv = "\uFEFFSKU,Name,Category\nKL-1001,Signature Blend,Coffee Beans";
    const result = parseCsv(csv);
    expect(result.headers).toEqual(["SKU", "Name", "Category"]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({
      SKU: "KL-1001",
      Name: "Signature Blend",
      Category: "Coffee Beans",
    });
  });

  it("handles quotes and commas inside quoted fields", () => {
    const csv = 'SKU,Name,Description\nKL-1001,"Caramel Latte, Hot","Rich, creamy, delicious"';
    const result = parseCsv(csv);
    expect(result.headers).toEqual(["SKU", "Name", "Description"]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]["Name"]).toBe("Caramel Latte, Hot");
    expect(result.rows[0]["Description"]).toBe("Rich, creamy, delicious");
  });

  it("handles CRLF line breaks correctly", () => {
    const csv = "SKU,Name\r\nKL-1001,Latte\r\nKL-1002,Espresso\r\n";
    const result = parseCsv(csv);
    expect(result.headers).toEqual(["SKU", "Name"]);
    expect(result.rowCount).toBe(2);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]["SKU"]).toBe("KL-1001");
    expect(result.rows[1]["SKU"]).toBe("KL-1002");
  });

  it("auto-detects semicolon delimited files", () => {
    const csv = "SKU;Name;Quantity\nKL-1001;Mocha;25\nKL-1002;Americano;10";
    const result = parseCsv(csv);
    expect(result.headers).toEqual(["SKU", "Name", "Quantity"]);
    expect(result.rowCount).toBe(2);
    expect(result.rows[0]).toEqual({
      SKU: "KL-1001",
      Name: "Mocha",
      Quantity: "25",
    });
  });

  it("deduplicates identical headers", () => {
    const csv = "Name,Name,Name\nCoffee,Bean,Ground";
    const result = parseCsv(csv);
    expect(result.headers).toEqual(["Name", "Name (2)", "Name (3)"]);
    expect(result.rows[0]).toEqual({
      Name: "Coffee",
      "Name (2)": "Bean",
      "Name (3)": "Ground",
    });
  });

  it("supports preview rows option", () => {
    const csv = "SKU,Name\n1,A\n2,B\n3,C\n4,D\n5,E";
    const result = parseCsv(csv, { preview: 2 });
    expect(result.headers).toEqual(["SKU", "Name"]);
    expect(result.rowCount).toBe(5);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]["SKU"]).toBe("1");
    expect(result.rows[1]["SKU"]).toBe("2");
  });
});
