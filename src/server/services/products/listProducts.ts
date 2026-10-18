import "server-only";

import {
  ALL_STORES,
  DEFAULT_DIR,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  PRODUCT_SORT_KEY,
  SORT_DIRECTION,
  STOCK_STATUS,
  STOCK_STATUS_ORDER,
} from "@/constants";
import { getStatus } from "@/domain";
import { normalizePageSize, paginate } from "@/helpers";
import type { Repository } from "@/server/repositories";
import type {
  ProductListItem,
  ProductListResponse,
  ProductListSummary,
  ProductRecord,
  StockStatus,
} from "@/types";
import { getStockForScope, sumStock } from "./stockScope";

type ProductComparator = (a: ProductListItem, b: ProductListItem) => number;

const COMPARATOR_MAP: Record<string, ProductComparator> = {
  [PRODUCT_SORT_KEY.STATUS]: (a, b) => {
    const diff = (STOCK_STATUS_ORDER[b.status] ?? 2) - (STOCK_STATUS_ORDER[a.status] ?? 2);
    return diff !== 0 ? diff : b.sku.localeCompare(a.sku);
  },
  [PRODUCT_SORT_KEY.SKU]: (a, b) => a.sku.localeCompare(b.sku),
  [PRODUCT_SORT_KEY.NAME]: (a, b) => a.name.localeCompare(b.name),
  [PRODUCT_SORT_KEY.CATEGORY]: (a, b) => a.category.localeCompare(b.category),
  [PRODUCT_SORT_KEY.ON_HAND]: (a, b) => a.onHand - b.onHand,
  [PRODUCT_SORT_KEY.REORDER_LEVEL]: (a, b) => a.reorderLevel - b.reorderLevel,
  [PRODUCT_SORT_KEY.UNIT_COST_SEN]: (a, b) => a.unitCostSen - b.unitCostSen,
  [PRODUCT_SORT_KEY.UPDATED_AT]: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
};

function searchMatches(product: ProductRecord, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return (
    product.sku.toLowerCase().includes(lowerQuery) ||
    product.name.toLowerCase().includes(lowerQuery)
  );
}

type FilterParams = {
  store: string | typeof ALL_STORES;
  q?: string;
  category?: string;
  status?: StockStatus;
};

function filterProducts(
  repo: Repository,
  products: ProductRecord[],
  params: FilterParams,
): ProductListItem[] {
  const { store, q, category, status } = params;
  const stores = repo.getStores();

  return products.flatMap((product) => {
    const stocks = getStockForScope(repo, product.sku, store);
    if (store !== ALL_STORES && stocks.length === 0) return [];
    if (q && !searchMatches(product, q)) return [];
    if (category && product.category !== category) return [];

    const { onHand, reorderLevel } = sumStock(stocks);
    const itemStatus = getStatus(onHand, reorderLevel);
    if (status && itemStatus !== status) return [];

    const movements = stores.flatMap((s) => repo.getMovements(product.sku, s.id, { limit: 1 }));
    const updatedAt = movements.reduce(
      (latest, m) => (m.createdAt > latest ? m.createdAt : latest),
      movements[0]?.createdAt ?? "2026-01-01T00:00:00Z",
    );

    return [{
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
    }];
  });
}

function sortProducts(
  items: ProductListItem[],
  sort: string,
  dir: "asc" | "desc",
): ProductListItem[] {
  const comparator = COMPARATOR_MAP[sort];
  if (!comparator) return items;
  return [...items].sort((a, b) =>
    dir === SORT_DIRECTION.DESC ? -comparator(a, b) : comparator(a, b),
  );
}

function buildSummary(
  repo: Repository,
  products: ProductRecord[],
  store: string | typeof ALL_STORES,
): ProductListSummary {
  const summaryItems = products
    .map((product) => {
      const scopeStocks = getStockForScope(repo, product.sku, store);
      if (store !== ALL_STORES && scopeStocks.length === 0) {
        return null;
      }
      const { onHand, reorderLevel } = sumStock(scopeStocks);
      return {
        onHand,
        unitCostSen: product.unitCostSen,
        status: getStatus(onHand, reorderLevel),
      };
    })
    .filter(
      (item): item is { onHand: number; unitCostSen: number; status: StockStatus } => item !== null,
    );

  return {
    totalProducts: summaryItems.length,
    stockValueSen: summaryItems.reduce((sum, item) => sum + item.onHand * item.unitCostSen, 0),
    lowStock: summaryItems.filter((item) => item.status === STOCK_STATUS.LOW).length,
    outOfStock: summaryItems.filter((item) => item.status === STOCK_STATUS.OUT).length,
  };
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
    pageSize,
  } = params;

  const validatedPageSize = normalizePageSize(pageSize);
  const allProducts = repo.listProducts();

  const filtered = filterProducts(repo, allProducts, { store, q, category, status });
  const sorted = sortProducts(filtered, sort, dir);
  const shouldPaginate = pageSize !== undefined || (!category && !status);
  const items = shouldPaginate ? paginate(sorted, page, validatedPageSize) : sorted;
  const summary = buildSummary(repo, allProducts, store);

  return {
    items,
    page,
    pageSize: validatedPageSize,
    total: sorted.length,
    summary,
  };
}
