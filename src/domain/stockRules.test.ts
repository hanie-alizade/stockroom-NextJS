import { describe, it, expect } from "vitest";
import { isValidQuantity, canRemoveStock, planTransfer } from "./stockRules";
import { AppError } from "./errors";

describe("isValidQuantity", () => {
  it("returns true for positive whole numbers", () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(10)).toBe(true);
    expect(isValidQuantity(1000)).toBe(true);
  });

  it("returns false for zero", () => {
    expect(isValidQuantity(0)).toBe(false);
  });

  it("returns false for negative numbers", () => {
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(-10)).toBe(false);
  });

  it("returns false for decimal numbers", () => {
    expect(isValidQuantity(1.5)).toBe(false);
    expect(isValidQuantity(10.1)).toBe(false);
    expect(isValidQuantity(0.5)).toBe(false);
  });

  it("returns false for NaN", () => {
    expect(isValidQuantity(NaN)).toBe(false);
  });
});

describe("canRemoveStock", () => {
  it("returns true when onHand is greater than quantity", () => {
    expect(canRemoveStock(10, 5)).toBe(true);
    expect(canRemoveStock(100, 50)).toBe(true);
  });

  it("returns true when onHand equals quantity (exactly zero remaining is allowed)", () => {
    expect(canRemoveStock(10, 10)).toBe(true);
    expect(canRemoveStock(1, 1)).toBe(true);
  });

  it("returns false when quantity exceeds onHand", () => {
    expect(canRemoveStock(10, 11)).toBe(false);
    expect(canRemoveStock(5, 10)).toBe(false);
  });
});

describe("planTransfer", () => {
  const input = {
    productId: "P1",
    from: { storeId: "store-1", onHand: 20 },
    to: { storeId: "store-2", onHand: 10 },
    quantity: 5,
    transferId: "transfer-123",
  };

  it("creates two movements with opposite quantities that sum to zero", () => {
    const result = planTransfer(input);

    expect(result.out.quantity).toBe(-5);
    expect(result.in.quantity).toBe(5);
    expect(result.out.quantity + result.in.quantity).toBe(0);
  });

  it("shares the same transferId on both movements", () => {
    const result = planTransfer(input);

    expect(result.out.transferId).toBe("transfer-123");
    expect(result.in.transferId).toBe("transfer-123");
  });

  it("sets correct balanceAfter values", () => {
    const result = planTransfer(input);

    expect(result.out.balanceAfter).toBe(15); // 20 - 5
    expect(result.in.balanceAfter).toBe(15); // 10 + 5
  });

  it("sets movement types correctly", () => {
    const result = planTransfer(input);

    expect(result.out.type).toBe("transfer_out");
    expect(result.in.type).toBe("transfer_in");
  });

  it("sets storeIds correctly", () => {
    const result = planTransfer(input);

    expect(result.out.storeId).toBe("store-1");
    expect(result.in.storeId).toBe("store-2");
  });

  it("sets productId on both movements", () => {
    const result = planTransfer(input);

    expect(result.out.productId).toBe("P1");
    expect(result.in.productId).toBe("P1");
  });

  it("throws AppError with INSUFFICIENT_STOCK when quantity exceeds source onHand", () => {
    const insufficientInput = {
      ...input,
      from: { storeId: "store-1", onHand: 3 },
      quantity: 5,
    };

    expect(() => planTransfer(insufficientInput)).toThrow(AppError);
    expect(() => planTransfer(insufficientInput)).toThrow("INSUFFICIENT_STOCK");
  });

  it("throws AppError with VALIDATION_ERROR and SAME_STORE field error when from and to are the same", () => {
    const sameStoreInput = {
      ...input,
      to: { storeId: "store-1", onHand: 10 },
    };

    expect(() => planTransfer(sameStoreInput)).toThrow(AppError);
    expect(() => planTransfer(sameStoreInput)).toThrow("VALIDATION_ERROR");

    try {
      planTransfer(sameStoreInput);
    } catch (error) {
      if (error instanceof AppError) {
        expect(error.fieldErrors).toBeDefined();
        expect(error.fieldErrors?.[0]).toEqual({
          field: "to",
          code: "SAME_STORE",
          message: expect.any(String),
        });
      }
    }
  });
});
