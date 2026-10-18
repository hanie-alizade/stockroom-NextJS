import { STOCK_STATUS } from "@/constants";
import type { StockStatus } from "@/types";

export type { StockStatus };

/**
 * Calculate stock status based on on-hand quantity and reorder level.
 * Returns "out" when onHand is 0, "low" when onHand > 0 and <= reorderLevel,
 * otherwise "in_stock". A reorder level of 0 can never be low.
 */
export function getStatus(onHand: number, reorderLevel: number): StockStatus {
  if (onHand === 0) {
    return STOCK_STATUS.OUT;
  }

  if (onHand > 0 && onHand <= reorderLevel) {
    return STOCK_STATUS.LOW;
  }

  return STOCK_STATUS.IN_STOCK;
}
