import "server-only";

import type { Repository, Product, Stock } from "@/lib/server/repo";
import { AppError } from "@/lib/domain/errors";
import type { StockHistoryResult } from "./types";

function calculateStockAggregate(stocks: Stock[]): { onHand: number; reorderLevel: number } {
  return stocks.reduce(
    (acc, stock) => ({
      onHand: acc.onHand + stock.onHand,
      reorderLevel: acc.reorderLevel + stock.reorderLevel,
    }),
    { onHand: 0, reorderLevel: 0 },
  );
}

function getStockForScope(repo: Repository, productId: string, storeId: string | "all"): Stock[] {
  if (storeId === "all") {
    return repo.listStock(productId);
  }
  const stock = repo.getStock(productId, storeId);
  return stock ? [stock] : [];
}

export async function getStockHistory(
  repo: Repository,
  sku: string,
  storeId: string | "all",
  days: number = 30,
): Promise<StockHistoryResult> {
  const product = repo.getProduct(sku);
  if (!product) {
    throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
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
