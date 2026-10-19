import { describe, it, expect } from "vitest";
import { parseMoneyToSen, formatMoney } from "../money";

describe("parseMoneyToSen", () => {
  it("parses simple decimal to sen", () => {
    expect(parseMoneyToSen("68.00")).toBe(6800);
    expect(parseMoneyToSen("12.50")).toBe(1250);
    expect(parseMoneyToSen("0.01")).toBe(1);
  });

  it("parses integer values", () => {
    expect(parseMoneyToSen("68")).toBe(6800);
    expect(parseMoneyToSen("100")).toBe(10000);
  });

  it("parses with RM prefix", () => {
    expect(parseMoneyToSen("RM 68")).toBe(6800);
    expect(parseMoneyToSen("RM 12.50")).toBe(1250);
    expect(parseMoneyToSen("RM 0.01")).toBe(1);
  });

  it("parses with currency symbol and spaces", () => {
    expect(parseMoneyToSen(" RM 68 ")).toBe(6800);
  });

  it("returns null for invalid formats", () => {
    expect(parseMoneyToSen("12abc")).toBeNull();
    expect(parseMoneyToSen("1e2")).toBeNull();
    expect(parseMoneyToSen("1,2,3")).toBeNull();
    expect(parseMoneyToSen("")).toBeNull();
    expect(parseMoneyToSen("-5")).toBeNull();
    expect(parseMoneyToSen("68.005")).toBeNull();
    expect(parseMoneyToSen("68.")).toBeNull();
    expect(parseMoneyToSen("abc")).toBeNull();
    expect(parseMoneyToSen("-10")).toBeNull();
  });

  it("returns null for more than 2 decimal places", () => {
    expect(parseMoneyToSen("68.001")).toBeNull();
    expect(parseMoneyToSen("12.345")).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats sen to decimal with two places", () => {
    expect(formatMoney(6800)).toBe("68.00");
    expect(formatMoney(1250)).toBe("12.50");
    expect(formatMoney(1)).toBe("0.01");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("0.00");
  });

  it("adds thousands separators", () => {
    expect(formatMoney(123450)).toBe("1,234.50");
    expect(formatMoney(18243050)).toBe("182,430.50");
    expect(formatMoney(1000000)).toBe("10,000.00");
  });

  it("includes RM prefix when withCurrency is true", () => {
    expect(formatMoney(6800, { withCurrency: true })).toBe("RM 68.00");
    expect(formatMoney(18243050, { withCurrency: true })).toBe("RM 182,430.50");
  });

  it("defaults to without currency symbol", () => {
    expect(formatMoney(6800)).toBe("68.00");
    expect(formatMoney(6800, {})).toBe("68.00");
  });
});
