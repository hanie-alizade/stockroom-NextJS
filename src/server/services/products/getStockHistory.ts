import "server-only";

import { ALL_STORES, ERROR_CODE, HTTP_STATUS } from "@/constants";
import { AppError } from "@/domain";
import { getCalendarParts, toDateString } from "@/helpers";
import type { Repository } from "@/server/repositories";
import type { StockHistory, StockHistoryPoint } from "@/types";
import { getStockForScope, sumStock } from "./stockScope";

/**
 * Reconstructs daily stock history over a given number of days for a product and store scope.
 */
export async function getStockHistory(
  repo: Repository,
  sku: string,
  storeId: string | typeof ALL_STORES,
  days: number = 30,
): Promise<StockHistory> {
  const product = repo.getProduct(sku);
  if (!product) {
    throw new AppError(ERROR_CODE.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  const stocks = getStockForScope(repo, sku, storeId);
  const { onHand: currentOnHand, reorderLevel } = sumStock(stocks);

  const movements =
    storeId === ALL_STORES
      ? repo.getStores().flatMap((s) => repo.getMovements(sku, s.id))
      : repo.getMovements(sku, storeId);

  const deltasByDate = new Map<string, number>();
  for (const m of movements) {
    const dStr = toDateString(m.createdAt);
    deltasByDate.set(dStr, (deltasByDate.get(dStr) ?? 0) + m.quantity);
  }

  const now = new Date();
  const todayParts = getCalendarParts(now);

  const points: StockHistoryPoint[] = [];
  let runningOnHand = currentOnHand;

  for (let step = 0; step <= days; step++) {
    const d = new Date(
      Date.UTC(todayParts.year, todayParts.month, todayParts.day - step, 12, 0, 0),
    );
    const dateStr = toDateString(d);

    points.push({
      date: dateStr,
      onHand: runningOnHand,
      reorderLevel,
    });

    const dayDelta = deltasByDate.get(dateStr) ?? 0;
    runningOnHand -= dayDelta;
  }

  points.reverse();

  return {
    points,
    reorderLevel,
    days,
  };
}
