import { describe, it, expect } from "vitest";
import { buildCsv } from "../csv";

describe("buildCsv", () => {
  it("quotes cells with commas, quotes, and newlines", () => {
    const columns = [
      { header: "Name", accessor: (r: { name: string }) => r.name },
      { header: "Note", accessor: (r: { note: string }) => r.note },
    ];
    const rows = [
      { name: "Coffee, Beans", note: 'Has "quotes"' },
      { name: "Line\nBreak", note: "Normal" },
    ];

    const result = buildCsv(columns, rows);
    const lines = result.split("\r\n");

    expect(lines[0]).toBe("Name,Note");
    expect(lines[1]).toBe('"Coffee, Beans","Has ""quotes"""');
    expect(lines[2]).toBe('"Line\nBreak",Normal');
  });

  it("protects against formula injection starting with =, +, -, @", () => {
    const columns = [{ header: "Formula", accessor: (r: { text: string }) => r.text }];
    const rows = [
      { text: "=cmd|' /C calc'!A0" },
      { text: "+12345" },
      { text: "-500" },
      { text: "@SUM(1,2)" },
      { text: "Safe Value" },
    ];

    const result = buildCsv(columns, rows);
    const lines = result.split("\r\n");

    expect(lines[1]).toBe("\"'=cmd|' /C calc'!A0\"");
    expect(lines[2]).toBe('"\'+12345"');
    expect(lines[3]).toBe('"\'-500"');
    expect(lines[4]).toBe('"\'@SUM(1,2)"');
    expect(lines[5]).toBe("Safe Value");
  });

  it("handles empty rows correctly", () => {
    const columns = [
      { header: "SKU", accessor: (r: { sku: string }) => r.sku },
      { header: "Name", accessor: (r: { name: string }) => r.name },
    ];
    const rows: { sku: string; name: string }[] = [];

    const result = buildCsv(columns, rows);

    expect(result).toBe("SKU,Name");
  });

  it("handles null and undefined values safely", () => {
    const columns = [{ header: "A", accessor: (r: { a?: string | null }) => r.a }];
    const rows = [{ a: null }, { a: undefined }, { a: "" }];

    const result = buildCsv(columns, rows);
    const lines = result.split("\r\n");

    expect(lines[0]).toBe("A");
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe("");
    expect(lines[3]).toBe("");
  });
});
