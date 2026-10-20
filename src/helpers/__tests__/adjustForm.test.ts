import { describe, it, expect } from "vitest";
import {
  parsePositiveInteger,
  validateQuantity,
  getSubmitButtonLabel,
  getOverStockErrorMessage,
  validateReason,
  calculatePreviewRows,
  getAdjustmentToast,
  type AdjustStoreOption,
} from "../adjustForm";
import { ADJUSTMENT_TYPE, STOCK_STATUS } from "@/constants";

describe("adjustForm helpers", () => {
  describe("whole-number parsing", () => {
    it("handles empty and whitespace", () => {
      expect(parsePositiveInteger("")).toBeNull();
      expect(parsePositiveInteger("   ")).toBeNull();
    });

    it("rejects zero", () => {
      expect(parsePositiveInteger("0")).toBeNull();
      expect(parsePositiveInteger("00")).toBeNull();
    });

    it("rejects negative numbers", () => {
      expect(parsePositiveInteger("-1")).toBeNull();
      expect(parsePositiveInteger("-10")).toBeNull();
    });

    it("rejects decimals", () => {
      expect(parsePositiveInteger("2.5")).toBeNull();
      expect(parsePositiveInteger("1.0")).toBeNull();
    });

    it("rejects non-numeric characters", () => {
      expect(parsePositiveInteger("abc")).toBeNull();
      expect(parsePositiveInteger("12a")).toBeNull();
    });

    it("rejects numbers exceeding MAX_QUANTITY", () => {
      expect(parsePositiveInteger("1000001")).toBeNull();
      expect(parsePositiveInteger("999999999999999999")).toBeNull();
    });

    it("parses valid trimmed integers up to MAX_QUANTITY", () => {
      expect(parsePositiveInteger(" 12 ")).toBe(12);
      expect(parsePositiveInteger("1")).toBe(1);
      expect(parsePositiveInteger("24")).toBe(24);
      expect(parsePositiveInteger("1000000")).toBe(1000000);
    });
  });

  describe("quantity validation messages", () => {
    it("returns correct message for empty input", () => {
      expect(validateQuantity("")).toBe("Enter a whole number above 0.");
      expect(validateQuantity("   ")).toBe("Enter a whole number above 0.");
    });

    it("returns correct message for non-integer decimals", () => {
      expect(validateQuantity("1.5")).toBe("Enter a whole number.");
      expect(validateQuantity("0.5")).toBe("Enter a whole number.");
    });

    it("returns correct message for 0 or negative numbers", () => {
      expect(validateQuantity("0")).toBe("Enter a number above 0.");
      expect(validateQuantity("-5")).toBe("Enter a number above 0.");
    });

    it("returns correct message for numbers exceeding 1,000,000", () => {
      expect(validateQuantity("1000001")).toBe("Quantity can't be more than 1,000,000.");
      expect(validateQuantity("999999999999999999")).toBe("Quantity can't be more than 1,000,000.");
    });

    it("returns null for valid positive integer within limit", () => {
      expect(validateQuantity("1")).toBeNull();
      expect(validateQuantity("50")).toBeNull();
      expect(validateQuantity("1000000")).toBeNull();
    });
  });

  describe("submit label", () => {
    it("formats singular unit", () => {
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.RECEIVE, "1")).toBe("Receive 1 unit");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.SELL, "1")).toBe("Sell 1 unit");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.WRITE_OFF, "1")).toBe("Write off 1 unit");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.TRANSFER, "1")).toBe("Transfer 1 unit");
    });

    it("formats plural units up to 9,999", () => {
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.RECEIVE, "20")).toBe("Receive 20 units");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.SELL, "2")).toBe("Sell 2 units");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.TRANSFER, "24")).toBe("Transfer 24 units");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.RECEIVE, "9999")).toBe("Receive 9999 units");
    });

    it("uses safe label without large numbers for 10,000+", () => {
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.RECEIVE, "10000")).toBe("Receive units");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.SELL, "1000000")).toBe("Sell units");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.TRANSFER, "50000")).toBe("Transfer units");
    });

    it("shows base label when quantity is empty or invalid", () => {
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.TRANSFER, "")).toBe("Transfer");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.TRANSFER, "2.5")).toBe("Transfer");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.SELL, "0")).toBe("Sell");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.RECEIVE, "abc")).toBe("Receive");
    });

    it("shows number even when over stock limit", () => {
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.TRANSFER, "24")).toBe("Transfer 24 units");
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.SELL, "999")).toBe("Sell 999 units");
    });

    it("shows saving state", () => {
      expect(getSubmitButtonLabel(ADJUSTMENT_TYPE.TRANSFER, "24", true)).toBe("Saving...");
    });
  });

  describe("over-stock message", () => {
    it("formats the over-stock message correctly", () => {
      expect(getOverStockErrorMessage("Mont Kiara", 18)).toBe(
        "Mont Kiara only has 18 on hand. Enter 18 or less.",
      );
      expect(getOverStockErrorMessage("Subang", 4)).toBe(
        "Subang only has 4 on hand. Enter 4 or less.",
      );
    });

    it("formats zero-stock transfer error message correctly", () => {
      expect(getOverStockErrorMessage("Cheras", 0, true)).toBe(
        "Cheras has no stock to transfer.",
      );
    });
  });

  describe("reason rule", () => {
    it("rejects reason shorter than 3 after trim", () => {
      expect(validateReason("")).toBe("Enter a reason (at least 3 characters).");
      expect(validateReason("  ")).toBe("Enter a reason (at least 3 characters).");
      expect(validateReason("ab")).toBe("Enter a reason (at least 3 characters).");
      expect(validateReason(" a ")).toBe("Enter a reason (at least 3 characters).");
    });

    it("accepts valid reason", () => {
      expect(validateReason("abc")).toBeNull();
      expect(validateReason("Bags torn in delivery")).toBeNull();
    });
  });

  describe("preview values and status badge rule", () => {
    const stores: AdjustStoreOption[] = [
      { storeId: "mont-kiara", storeName: "Mont Kiara", onHand: 18, reorderLevel: 5 },
      { storeId: "subang", storeName: "Subang", onHand: 4, reorderLevel: 5 },
      { storeId: "cheras", storeName: "Cheras", onHand: 0, reorderLevel: 5 },
    ];

    it("calculates receive preview with addition", () => {
      const rows = calculatePreviewRows({
        type: ADJUSTMENT_TYPE.RECEIVE,
        stores,
        storeId: "mont-kiara",
        quantityStr: "10",
      });
      expect(rows).toEqual([
        { storeId: "mont-kiara", storeName: "Mont Kiara", beforeOnHand: 18, afterOnHand: 28, status: STOCK_STATUS.IN_STOCK, showBadge: false },
      ]);
    });

    it("calculates sell preview with low status badge", () => {
      const rows = calculatePreviewRows({
        type: ADJUSTMENT_TYPE.SELL,
        stores,
        storeId: "mont-kiara",
        quantityStr: "14",
      });
      expect(rows).toEqual([
        { storeId: "mont-kiara", storeName: "Mont Kiara", beforeOnHand: 18, afterOnHand: 4, status: STOCK_STATUS.LOW, showBadge: true },
      ]);
    });

    it("calculates sell preview with out of stock badge", () => {
      const rows = calculatePreviewRows({
        type: ADJUSTMENT_TYPE.SELL,
        stores,
        storeId: "subang",
        quantityStr: "4",
      });
      expect(rows).toEqual([
        { storeId: "subang", storeName: "Subang", beforeOnHand: 4, afterOnHand: 0, status: STOCK_STATUS.OUT, showBadge: true },
      ]);
    });

    it("returns null afterOnHand when quantity exceeds stock", () => {
      const rows = calculatePreviewRows({
        type: ADJUSTMENT_TYPE.SELL,
        stores,
        storeId: "subang",
        quantityStr: "10",
      });
      expect(rows[0].afterOnHand).toBeNull();
      expect(rows[0].showBadge).toBe(false);
    });

    it("returns null afterOnHand when quantity is empty or invalid", () => {
      const rows = calculatePreviewRows({
        type: ADJUSTMENT_TYPE.SELL,
        stores,
        storeId: "subang",
        quantityStr: "",
      });
      expect(rows[0].afterOnHand).toBeNull();
      expect(rows[0].showBadge).toBe(false);
    });

    it("calculates transfer preview for two stores", () => {
      const rows = calculatePreviewRows({
        type: ADJUSTMENT_TYPE.TRANSFER,
        stores,
        fromStoreId: "mont-kiara",
        toStoreId: "subang",
        quantityStr: "12",
      });
      expect(rows).toEqual([
        { storeId: "mont-kiara", storeName: "Mont Kiara", beforeOnHand: 18, afterOnHand: 6, status: STOCK_STATUS.IN_STOCK, showBadge: false },
        { storeId: "subang", storeName: "Subang", beforeOnHand: 4, afterOnHand: 16, status: STOCK_STATUS.IN_STOCK, showBadge: false },
      ]);
    });

    it("hides preview when no store is chosen", () => {
      const rows = calculatePreviewRows({ type: ADJUSTMENT_TYPE.SELL, stores, quantityStr: "5" });
      expect(rows).toHaveLength(0);
    });
  });

  describe("getAdjustmentToast", () => {
    const toastStores = [
      { id: "mont-kiara", name: "Mont Kiara" },
      { id: "subang", name: "Subang" },
    ];

    it("formats Transfer toast (plural and singular)", () => {
      expect(
        getAdjustmentToast({ type: ADJUSTMENT_TYPE.TRANSFER, fromStoreId: "mont-kiara", toStoreId: "subang", quantity: 12 }, toastStores),
      ).toEqual({ title: "Transfer saved", description: "12 units moved from Mont Kiara to Subang." });

      expect(
        getAdjustmentToast({ type: ADJUSTMENT_TYPE.TRANSFER, fromStoreId: "mont-kiara", toStoreId: "subang", quantity: 1 }, toastStores),
      ).toEqual({ title: "Transfer saved", description: "1 unit moved from Mont Kiara to Subang." });
    });

    it("formats Receive toast (plural and singular)", () => {
      expect(
        getAdjustmentToast({ type: ADJUSTMENT_TYPE.RECEIVE, storeId: "mont-kiara", quantity: 20 }, toastStores),
      ).toEqual({ title: "Stock received", description: "+20 units at Mont Kiara." });

      expect(
        getAdjustmentToast({ type: ADJUSTMENT_TYPE.RECEIVE, storeId: "mont-kiara", quantity: 1 }, toastStores),
      ).toEqual({ title: "Stock received", description: "+1 unit at Mont Kiara." });
    });

    it("formats Sell toast (plural and singular with true minus sign)", () => {
      const plural = getAdjustmentToast({ type: ADJUSTMENT_TYPE.SELL, storeId: "subang", quantity: 2 }, toastStores);
      expect(plural).toEqual({ title: "Sale recorded", description: "−2 units at Subang." });
      expect(plural.description).toContain("\u2212");

      expect(
        getAdjustmentToast({ type: ADJUSTMENT_TYPE.SELL, storeId: "subang", quantity: 1 }, toastStores),
      ).toEqual({ title: "Sale recorded", description: "−1 unit at Subang." });
    });

    it("formats Write-off toast (plural and singular)", () => {
      expect(
        getAdjustmentToast({ type: ADJUSTMENT_TYPE.WRITE_OFF, storeId: "mont-kiara", quantity: 2, note: "Damaged" }, toastStores),
      ).toEqual({ title: "Write-off saved", description: "2 units written off at Mont Kiara." });

      expect(
        getAdjustmentToast({ type: ADJUSTMENT_TYPE.WRITE_OFF, storeId: "mont-kiara", quantity: 1, note: "Expired" }, toastStores),
      ).toEqual({ title: "Write-off saved", description: "1 unit written off at Mont Kiara." });
    });
  });
});
