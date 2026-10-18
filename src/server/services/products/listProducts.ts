import "server-only";

import {
  ALL_STORES,
  DEFAULT_DIR,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  PAGE_SIZE_OPTIONS,
  PRODUCT_SORT_KEY,
  SORT_DIRECTION,
  STOCK_STATUS,
  STOCK_STATUS_ORDER,
} from "@/constants";
import { getStatus } from "@/domain";
import type { Repository } from "@/server/repositories";
import type {
  ProductListItem,
  ProductListResponse,
  ProductListSummary,
  ProductRecord,
  StockRecord,
  StockStatus,
} from "@/types";

function isValidPageSize(size: number): boolean {
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size);
}

function sortKeyToStatusOrder(key: StockStatus): number {
  return STOCK_STATUS_ORDER[key] ?? 2;
}

function searchMatches(product: ProductRecord, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return (
    product.sku.toLowerCase().includes(lowerQuery) ||
    product.name.toLowerCase().includes(lowerQuery)
  );
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

export async function listProducts(
  repo: Repository,
  params: {
    store?: string | typeof ALL_STORES;
    q?: string;
    category?: string;
    status?: StockStatus;
    sort?: string;
    dir?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  },
): Promise<ProductListResponse> {
  const {
    store = ALL_STORES,
    q,
    category,
    status,
    sort = DEFAULT_SORT,
    dir = DEFAULT_DIR,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
  } = params;

  const validatedPageSize = isValidPageSize(pageSize) ? pageSize : DEFAULT_PAGE_SIZE;

  const allProducts = repo.listProducts();
  const stores = repo.getStores();

  let filteredItems: ProductListItem[] = [];

  for (const product of allProducts) {
    const stocks = getStockForScope(repo, product.sku, store);

    if (store !== ALL_STORES && stocks.length === 0) {
      continue;
    }

    if (q && !searchMatches(product, q)) {
      continue;
    }

    if (category && product.category !== category) {
      continue;
    }

    const { onHand, reorderLevel } = calculateStockAggregate(stocks);
    const itemStatus = getStatus(onHand, reorderLevel);

    if (status && itemStatus !== status) {
      continue;
    }

    const movements = stores.flatMap((s) => repo.getMovements(product.sku, s.id, { limit: 1 }));
    const updatedAt =
      movements.length > 0
        ? movements.reduce(
            (latest, m) => (m.createdAt > latest ? m.createdAt : latest),
            movements[0].createdAt,
          )
        : "2026-01-01T00:00:00Z";

    filteredItems.push({
      id: product.sku,
      sku: product.sku,
      name: product.name,
      category: product.category,
      supplier: product.supplier,
      unitCostSen: product.unitCostSen,
      onHand,
      reorderLevel,
      status: itemStatus,
      updatedAt,
    });
  }

  filteredItems.sort((a, b) => {
    let comparison = 0;

    if (sort === PRODUCT_SORT_KEY.STATUS) {
      const aOrder = sortKeyToStatusOrder(a.status);
      const bOrder = sortKeyToStatusOrder(b.status);
      const statusDiff = dir === SORT_DIRECTION.DESC ? aOrder - bOrder : bOrder - aOrder;
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return dir === SORT_DIRECTION.DESC ? a.sku.localeCompare(b.sku) : b.sku.localeCompare(a.sku);
    } else if (sort === PRODUCT_SORT_KEY.SKU) {
      comparison = a.sku.localeCompare(b.sku);
    } else if (sort === PRODUCT_SORT_KEY.NAME) {
      comparison = a.name.localeCompare(b.name);
    } else if (sort === PRODUCT_SORT_KEY.CATEGORY) {
      comparison = a.category.localeCompare(b.category);
    } else if (sort === PRODUCT_SORT_KEY.ON_HAND) {
      comparison = a.onHand - b.onHand;
    } else if (sort === PRODUCT_SORT_KEY.REORDER_LEVEL) {
      comparison = a.reorderLevel - b.reorderLevel;
    } else if (sort === PRODUCT_SORT_KEY.UNIT_COST_SEN) {
      comparison = a.unitCostSen - b.unitCostSen;
    } else if (sort === PRODUCT_SORT_KEY.UPDATED_AT) {
      comparison = a.updatedAt.localeCompare(b.updatedAt);
    }

    return dir === SORT_DIRECTION.DESC ? -comparison : comparison;
  });

  const total = filteredItems.length;
  const startIndex = (page - 1) * validatedPageSize;
  const endIndex = startIndex + validatedPageSize;
  const items = filteredItems.slice(startIndex, endIndex);

  const summaryItems = allProducts
    .map((product) => {
      const scopeStocks = getStockForScope(repo, product.sku, store);
      if (store !== ALL_STORES && scopeStocks.length === 0) {
        return null;
      }
      const { onHand, reorderLevel } = calculateStockAggregate(scopeStocks);
      const itemStatus = getStatus(onHand, reorderLevel);
      return {
        onHand,
        unitCostSen: product.unitCostSen,
        status: itemStatus,
      };
    })
    .filter(
      (item): item is { onHand: number; unitCostSen: number; status: StockStatus } => item !== null,
    );

  const summary: ProductListSummary = {
    totalProducts: summaryItems.length,
    stockValueSen: summaryItems.reduce((sum, item) => sum + item.onHand * item.unitCostSen, 0),
    lowStock: summaryItems.filter((item) => item.status === STOCK_STATUS.LOW).length,
    outOfStock: summaryItems.filter((item) => item.status === STOCK_STATUS.OUT).length,
  };

  return {
    items,
    page,
    pageSize: validatedPageSize,
    total,
    summary,
  };
}
