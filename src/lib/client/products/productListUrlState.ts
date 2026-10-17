import type { ProductListQuery, StockStatus, ProductSortKey } from "@/lib/types/product";
import type { PageSize, SortDirection } from "@/lib/types/common";
import type { StoreScope } from "@/lib/types/store";

export interface RouterInstance {
  push: (href: string) => void;
  replace: (href: string) => void;
}

const VALID_SORT_KEYS = new Set<ProductSortKey>([
  "sku",
  "name",
  "category",
  "onHand",
  "reorderLevel",
  "unitCostSen",
  "status",
  "updatedAt",
]);

function getParam(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? undefined;
  }
  const val = source[key];
  if (Array.isArray(val)) {
    return val[0];
  }
  return val;
}

export function parseProductListParams(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
): ProductListQuery {
  const storeRaw = getParam(source, "store");
  const store: StoreScope = storeRaw && storeRaw !== "all" ? storeRaw : "all";

  const qRaw = getParam(source, "q")?.trim();
  const q = qRaw ? qRaw : undefined;

  const categoryRaw = getParam(source, "category");
  const category = categoryRaw && categoryRaw !== "all" ? categoryRaw : undefined;

  const statusRaw = getParam(source, "status");
  const status: StockStatus | undefined =
    statusRaw === "in_stock" || statusRaw === "low" || statusRaw === "out" ? statusRaw : undefined;

  const sortRaw = getParam(source, "sort") as ProductSortKey | undefined;
  const sort: ProductSortKey = sortRaw && VALID_SORT_KEYS.has(sortRaw) ? sortRaw : "updatedAt";

  const dirRaw = getParam(source, "dir");
  const dir: SortDirection = dirRaw === "asc" ? "asc" : "desc";

  const pageRaw = Number(getParam(source, "page"));
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const pageSizeRaw = Number(getParam(source, "pageSize"));
  const pageSize: PageSize = pageSizeRaw === 50 || pageSizeRaw === 100 ? pageSizeRaw : 25;

  return {
    store,
    q,
    category,
    status,
    sort,
    dir,
    page,
    pageSize,
  };
}

export function buildProductListUrl(pathname: string, query: ProductListQuery): string {
  const params = new URLSearchParams();

  if (query.store && query.store !== "all") {
    params.set("store", query.store);
  }
  if (query.q && query.q.trim()) {
    params.set("q", query.q.trim());
  }
  if (query.category && query.category !== "all") {
    params.set("category", query.category);
  }
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.sort && (query.sort !== "updatedAt" || query.dir !== "desc")) {
    params.set("sort", query.sort);
    params.set("dir", query.dir ?? "desc");
  }
  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }
  if (query.pageSize && query.pageSize !== 25) {
    params.set("pageSize", String(query.pageSize));
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function setProductListSearch(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
  q: string,
): void {
  const next: ProductListQuery = {
    ...current,
    q: q.trim() || undefined,
    page: 1,
  };
  router.replace(buildProductListUrl(pathname, next));
}

export function setProductListCategory(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
  category?: string,
): void {
  const next: ProductListQuery = {
    ...current,
    category,
    page: 1,
  };
  router.push(buildProductListUrl(pathname, next));
}

export function setProductListStatus(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
  status?: StockStatus,
): void {
  const next: ProductListQuery = {
    ...current,
    status,
    page: 1,
  };
  router.push(buildProductListUrl(pathname, next));
}

export function setProductListPage(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
  page: number,
): void {
  const next: ProductListQuery = {
    ...current,
    page,
  };
  router.push(buildProductListUrl(pathname, next));
}

export function setProductListPageSize(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
  pageSize: PageSize,
): void {
  const next: ProductListQuery = {
    ...current,
    pageSize,
    page: 1,
  };
  router.push(buildProductListUrl(pathname, next));
}

export function toggleProductListSort(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
  column: ProductSortKey,
): void {
  let nextSort: ProductSortKey = column;
  let nextDir: SortDirection = "desc";

  if (current.sort === column) {
    if (current.dir === "desc") {
      nextDir = "asc";
    } else {
      nextSort = "updatedAt";
      nextDir = "desc";
    }
  }

  const next: ProductListQuery = {
    ...current,
    sort: nextSort,
    dir: nextDir,
  };
  router.push(buildProductListUrl(pathname, next));
}
