import "server-only";

import { ALL_STORES } from "@/constants";
import type { Repository } from "@/server/repositories";
import type { StockRecord } from "@/types";

export function sumStock(stocks: StockRecord[]): { onHand: number; reorderLevel: number } {
  return stocks.reduce(
    (acc, stock) => ({
      onHand: acc.onHand + stock.onHand,
      reorderLevel: acc.reorderLevel + stock.reorderLevel,
    }),
    { onHand: 0, reorderLevel: 0 },
  );
}

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
