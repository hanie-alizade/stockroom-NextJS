import "server-only";

import { ALL_STORES, ERROR_CODE, HTTP_STATUS } from "@/constants";
import { AppError, getStatus } from "@/domain";
import type { Repository } from "@/server/repositories";
import type { ProductDetail } from "@/types";
import { getStockForScope, sumStock } from "./stockScope";

/**
 * Retrieves full product details, stock by store, and totals for a given store scope.
 */
export async function getProductDetail(
  repo: Repository,
  sku: string,
  storeId: string | typeof ALL_STORES,
): Promise<ProductDetail> {
  const product = repo.getProduct(sku);
  if (!product) {
    throw new AppError(ERROR_CODE.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  const stocks = getStockForScope(repo, sku, storeId);
  const { onHand, reorderLevel } = sumStock(stocks);

  const stockValueSen = onHand * product.unitCostSen;

  const scopedMovements =
    storeId === ALL_STORES
      ? repo.getStores().flatMap((s) => repo.getMovements(sku, s.id, { limit: 1 }))
      : repo.getMovements(sku, storeId, { limit: 1 });
  const lastMovementAt =
    scopedMovements.length > 0
      ? scopedMovements.reduce(
          (latest, m) => (m.createdAt > latest ? m.createdAt : latest),
          scopedMovements[0].createdAt,
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
    id: product.sku,
    sku: product.sku,
    name: product.name,
    category: product.category,
    supplier: product.supplier,
    unitCostSen: product.unitCostSen,
    onHand,
    reorderLevel,
    status: getStatus(onHand, reorderLevel),
    stockValueSen,
    lastMovementAt,
    stockByStore,
  };
}
