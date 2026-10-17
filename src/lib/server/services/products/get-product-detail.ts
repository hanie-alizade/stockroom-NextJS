import "server-only";

import type { Repository, Product, Stock } from "@/lib/server/repo";
import { getStatus } from "@/lib/domain/status";
import type { StockStatus } from "@/lib/domain/status";
import { AppError } from "@/lib/domain/errors";
import type { ProductDetail } from "./types";

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

export async function getProductDetail(
  repo: Repository,
  sku: string,
  storeId: string | "all",
): Promise<ProductDetail> {
  const product = repo.getProduct(sku);
  if (!product) {
    throw new AppError("PRODUCT_NOT_FOUND", 404, "Product not found");
  }

  const stocks = getStockForScope(repo, sku, storeId);
  const { onHand, reorderLevel } = calculateStockAggregate(stocks);

  const stockValueSen = onHand * product.unitCostSen;

  const allMovements = repo.getStores().flatMap((s) => repo.getMovements(sku, s.id, { limit: 1 }));
  const lastMovementAt =
    allMovements.length > 0
      ? allMovements.reduce(
          (latest, m) => (m.createdAt > latest ? m.createdAt : latest),
          allMovements[0].createdAt,
        )
      : null;

  const stockByStore = stocks.map((stock) => {
    const movements = repo.getMovements(sku, stock.storeId, { limit: 1 });
    const lastMovementAtForStore = movements.length > 0 ? movements[0].createdAt : null;

    return {
      storeId: stock.storeId,
      onHand: stock.onHand,
      reorderLevel: stock.reorderLevel,
      status: getStatus(stock.onHand, stock.reorderLevel),
      lastMovementAt: lastMovementAtForStore,
    };
  });

  return {
    sku: product.sku,
    name: product.name,
    category: product.category,
    supplier: product.supplier,
    unitCostSen: product.unitCostSen,
    stockValueSen,
    lastMovementAt,
    stockByStore,
  };
}
