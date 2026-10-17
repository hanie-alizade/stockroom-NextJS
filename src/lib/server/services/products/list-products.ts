import "server-only";

import type { Repository, Product, Stock } from "@/lib/server/repo";
import { getStatus } from "@/lib/domain/status";
import type { StockStatus } from "@/lib/domain/status";
import type { ProductListItem, ProductSummary, ProductListResult } from "./types";

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT = "updatedAt";
const DEFAULT_DIR = "desc";

function isValidPageSize(size: number): boolean {
  return size === 25 || size === 50 || size === 100;
}

function sortKeyToStatusOrder(key: string): number {
  if (key === "out") return 0;
  if (key === "low") return 1;
  return 2;
}

function searchMatches(product: Product, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return (
    product.sku.toLowerCase().includes(lowerQuery) ||
    product.name.toLowerCase().includes(lowerQuery)
  );
}

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

export async function listProducts(
  repo: Repository,
  params: {
    store?: string | "all";
    q?: string;
    category?: string;
    status?: StockStatus;
    sort?: string;
    dir?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  },
): Promise<ProductListResult> {
  const {
    store = "all",
    q,
    category,
    status,
    sort = DEFAULT_SORT,
    dir = DEFAULT_DIR,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = params;

  const validatedPageSize = isValidPageSize(pageSize) ? pageSize : DEFAULT_PAGE_SIZE;

  const allProducts = repo.listProducts();
  const stores = repo.getStores();

  let filteredItems: ProductListItem[] = [];

  for (const product of allProducts) {
    const stocks = getStockForScope(repo, product.sku, store);

    if (store !== "all" && stocks.length === 0) {
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

    if (sort === "status") {
      const aOrder = sortKeyToStatusOrder(a.status);
      const bOrder = sortKeyToStatusOrder(b.status);
      comparison = aOrder - bOrder;
      if (comparison === 0) {
        comparison = a.sku.localeCompare(b.sku);
      }
    } else if (sort === "sku") {
      comparison = a.sku.localeCompare(b.sku);
    } else if (sort === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sort === "category") {
      comparison = a.category.localeCompare(b.category);
    } else if (sort === "onHand") {
      comparison = a.onHand - b.onHand;
    } else if (sort === "reorderLevel") {
      comparison = a.reorderLevel - b.reorderLevel;
    } else if (sort === "updatedAt") {
      comparison = a.updatedAt.localeCompare(b.updatedAt);
    }

    return dir === "desc" ? -comparison : comparison;
  });

  const total = filteredItems.length;
  const startIndex = (page - 1) * validatedPageSize;
  const endIndex = startIndex + validatedPageSize;
  const items = filteredItems.slice(startIndex, endIndex);

  const summaryItems = allProducts
    .map((product) => {
      const scopeStocks = getStockForScope(repo, product.sku, store);
      if (store !== "all" && scopeStocks.length === 0) {
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

  const summary: ProductSummary = {
    totalProducts: summaryItems.length,
    stockValueSen: summaryItems.reduce((sum, item) => sum + item.onHand * item.unitCostSen, 0),
    lowStock: summaryItems.filter((item) => item.status === "low").length,
    outOfStock: summaryItems.filter((item) => item.status === "out").length,
  };

  return {
    items,
    page,
    pageSize: validatedPageSize,
    total,
    summary,
  };
}
