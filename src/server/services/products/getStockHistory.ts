import "server-only";

import { ALL_STORES, ERROR_CODE, HTTP_STATUS } from "@/constants";
import { AppError } from "@/domain";
import type { Repository } from "@/server/repositories";
import type { StockHistoryResult, StockRecord } from "@/types";

function calculateStockAggregate(stocks: StockRecord[]): { onHand: number; reorderLevel: number } {
  return stocks.reduce(
    (acc, stock) => ({
      onHand: acc.onHand + stock.onHand,
      reorderLevel: acc.reorderLevel + stock.reorderLevel,
    }),
    { onHand: 0, reorderLevel: 0 },
  );
}

function getStockForScope(repo: Repository, productId: string, storeId: string | typeof ALL_STORES): StockRecord[] {
  if (storeId === ALL_STORES) {
    return repo.listStock(productId);
  }
  const stock = repo.getStock(productId, storeId);
  return stock ? [stock] : [];
}

export async function getStockHistory(
  repo: Repository,
  sku: string,
  storeId: string | typeof ALL_STORES,
  days: number = 30,
): Promise<StockHistoryResult> {
  const product = repo.getProduct(sku);
  if (!product) {
    throw new AppError(ERROR_CODE.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  const stocks = getStockForScope(repo, sku, storeId);
  const { onHand: currentOnHand, reorderLevel: currentReorderLevel } =
    calculateStockAggregate(stocks);

  const points = [];
  const now = new Date();

  for (let i = 0; i <= days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    points.push({
      date: dateStr,
      onHand: currentOnHand,
      reorderLevel: currentReorderLevel,
    });
  }

  points.reverse();

  return {
    points,
    days,
  };
}
