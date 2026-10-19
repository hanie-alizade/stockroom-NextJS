import { describe, it, expect } from "vitest";
import { getStatus, type StockStatus } from "../status";

describe("getStatus", () => {
  it("returns 'out' when on hand is 0", () => {
    expect(getStatus(0, 5)).toBe("out");
    expect(getStatus(0, 0)).toBe("out");
    expect(getStatus(0, 10)).toBe("out");
  });

  it("returns 'low' when on hand is positive and at or below reorder level", () => {
    expect(getStatus(5, 5)).toBe("low");
    expect(getStatus(3, 5)).toBe("low");
    expect(getStatus(1, 10)).toBe("low");
  });

  it("returns 'in_stock' when on hand is above reorder level", () => {
    expect(getStatus(10, 5)).toBe("in_stock");
    expect(getStatus(6, 5)).toBe("in_stock");
    expect(getStatus(100, 10)).toBe("in_stock");
  });

  it("never returns 'low' when reorder level is 0 (edge case from DECISIONS.md)", () => {
    expect(getStatus(1, 0)).toBe("in_stock");
    expect(getStatus(5, 0)).toBe("in_stock");
    expect(getStatus(100, 0)).toBe("in_stock");
  });

  it("works with summed values for 'all stores' scope", () => {
    expect(getStatus(84, 30)).toBe("in_stock");
    expect(getStatus(4, 30)).toBe("low");
  });

  it("handles cases where per-store statuses differ from the aggregate status", () => {
    // Store 1 is 0/5 (out) and Store 2 is 1/5 (low), but aggregate 1 vs 10 is low
    expect(getStatus(0, 5)).toBe("out");
    expect(getStatus(1, 5)).toBe("low");
    expect(getStatus(0 + 1, 5 + 5)).toBe("low");

    // An 'out' store sitting inside an 'in_stock' aggregate
    // Store 1 is 0/5 (out) and Store 2 is 20/5 (in_stock), aggregate 20 vs 10 is in_stock
    expect(getStatus(0, 5)).toBe("out");
    expect(getStatus(20, 5)).toBe("in_stock");
    expect(getStatus(0 + 20, 5 + 5)).toBe("in_stock");
  });
});

