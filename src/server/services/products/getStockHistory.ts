import "server-only";

import { ALL_STORES, ERROR_CODE, HTTP_STATUS } from "@/constants";
import { AppError } from "@/domain";
import type { Repository } from "@/server/repositories";
import type { StockHistoryPoint, StockHistoryResult, StockRecord } from "@/types";

const APP_TIME_ZONE = "Asia/Kuala_Lumpur";

function toDateStringInTz(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

function getCalendarPartsInTz(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(partMap.year),
    month: Number(partMap.month) - 1,
    day: Number(partMap.day),
  };
}

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
  daysInput: number = 30,
): Promise<StockHistoryResult> {
  const product = repo.getProduct(sku);
  if (!product) {
    throw new AppError(ERROR_CODE.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  const validDays = [7, 30, 90];
  const days = validDays.includes(daysInput) ? daysInput : 30;

  const stocks = getStockForScope(repo, sku, storeId);
  const { onHand: currentOnHand, reorderLevel } = calculateStockAggregate(stocks);

  const movements =
    storeId === ALL_STORES
      ? repo.getStores().flatMap((s) => repo.getMovements(sku, s.id))
      : repo.getMovements(sku, storeId);

  const deltasByDate = new Map<string, number>();
  for (const m of movements) {
    const dStr = toDateStringInTz(m.createdAt);
    deltasByDate.set(dStr, (deltasByDate.get(dStr) ?? 0) + m.quantity);
  }

  const now = new Date();
  const todayParts = getCalendarPartsInTz(now);

  const points: StockHistoryPoint[] = [];
  let runningOnHand = currentOnHand;

  for (let step = 0; step <= days; step++) {
    const d = new Date(Date.UTC(todayParts.year, todayParts.month, todayParts.day - step, 12, 0, 0));
    const dateStr = toDateStringInTz(d);

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
