import { describe, it, expect } from "vitest";
import { formatUnitCostCsv } from "../productsCsv";

describe("formatUnitCostCsv", () => {
  it("formats standard amounts with integer math", () => {
    expect(formatUnitCostCsv(6800)).toBe("68.00");
    expect(formatUnitCostCsv(1250)).toBe("12.50");
    expect(formatUnitCostCsv(100)).toBe("1.00");
  });

  it("formats zero sen correctly", () => {
    expect(formatUnitCostCsv(0)).toBe("0.00");
  });

  it("formats single digit cents with leading zero", () => {
    expect(formatUnitCostCsv(1)).toBe("0.01");
    expect(formatUnitCostCsv(9)).toBe("0.09");
    expect(formatUnitCostCsv(105)).toBe("1.05");
  });

  it("formats larger amounts without commas (CSV raw value)", () => {
    expect(formatUnitCostCsv(12345678)).toBe("123456.78");
  });

  it("handles negative amounts", () => {
    expect(formatUnitCostCsv(-1250)).toBe("-12.50");
    expect(formatUnitCostCsv(-5)).toBe("-0.05");
  });
});
