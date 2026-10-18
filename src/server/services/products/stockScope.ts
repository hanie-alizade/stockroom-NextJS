import "server-only";

import { ALL_STORES } from "@/constants";
import type { Repository, StockRecord } from "@/server/repositories";

/**
 * Calculates aggregate on-hand quantity and reorder level across a collection of stock records.
 */
export function sumStock(stocks: StockRecord[]): { onHand: number; reorderLevel: number } {
  return stocks.reduce(
    (acc, stock) => ({
      onHand: acc.onHand + stock.onHand,
      reorderLevel: acc.reorderLevel + stock.reorderLevel,
    }),
    { onHand: 0, reorderLevel: 0 },
  );
}

/**
 * Retrieves stock records for a product matching a specific store or all stores.
 */
export function getStockForScope(
  repo: Repository,
  productId: string,
  storeId: string | typeof ALL_STORES,
): StockRecord[] {
  if (storeId === ALL_STORES) {
    return repo.listStock(productId);
  }
  const stock = repo.getStock(productId, storeId);
  return stock ? [stock] : [];
}
