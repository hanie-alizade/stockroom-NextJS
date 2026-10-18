import {
  ALL_STORES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PRODUCT_SORT_KEY,
  DEFAULT_SORT_DIRECTION,
  PAGE_SIZE_OPTIONS,
  PRODUCT_SORT_KEY,
  SORT_DIRECTION,
  STOCK_STATUS,
} from "@/constants";
import type {
  PageSize,
  ProductListQuery,
  ProductSortKey,
  SortDirection,
  StockStatus,
  StoreScope,
} from "@/types";

export interface RouterInstance {
  push: (href: string) => void;
  replace: (href: string) => void;
}

const VALID_SORT_KEYS = new Set<ProductSortKey>(Object.values(PRODUCT_SORT_KEY));

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
  const store: StoreScope = storeRaw && storeRaw !== ALL_STORES ? storeRaw : ALL_STORES;

  const qRaw = getParam(source, "q")?.trim();
  const q = qRaw ? qRaw : undefined;

  const categoryRaw = getParam(source, "category");
  const category = categoryRaw && categoryRaw !== ALL_STORES ? categoryRaw : undefined;

  const statusRaw = getParam(source, "status");
  const status: StockStatus | undefined =
    statusRaw === STOCK_STATUS.IN_STOCK ||
    statusRaw === STOCK_STATUS.LOW ||
    statusRaw === STOCK_STATUS.OUT
      ? statusRaw
      : undefined;

  const sortRaw = getParam(source, "sort") as ProductSortKey | undefined;
  const sort: ProductSortKey | undefined =
    sortRaw && VALID_SORT_KEYS.has(sortRaw) ? sortRaw : undefined;

  const dirRaw = getParam(source, "dir");
  let dir: SortDirection | undefined;
  if (sort) {
    dir =
      dirRaw === SORT_DIRECTION.ASC || dirRaw === SORT_DIRECTION.DESC
        ? dirRaw
        : DEFAULT_SORT_DIRECTION;
  }

  const pageRaw = Number(getParam(source, "page"));
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : DEFAULT_PAGE;

  const pageSizeRaw = Number(getParam(source, "pageSize"));
  const pageSize: PageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSizeRaw)
    ? (pageSizeRaw as PageSize)
    : DEFAULT_PAGE_SIZE;

  const failRaw = getParam(source, "fail");
  const fail = failRaw === "1" ? "1" : undefined;

  return {
    store,
    q,
    category,
    status,
    sort,
    dir,
    page,
    pageSize,
    fail,
  };
}

export function buildProductListUrl(pathname: string, query: ProductListQuery): string {
  const params = new URLSearchParams();

  if (query.store && query.store !== ALL_STORES) {
    params.set("store", query.store);
  }
  if (query.q && query.q.trim()) {
    params.set("q", query.q.trim());
  }
  if (query.category && query.category !== ALL_STORES) {
    params.set("category", query.category);
  }
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.sort) {
    params.set("sort", query.sort);
    params.set("dir", query.dir ?? DEFAULT_SORT_DIRECTION);
  }
  if (query.page && query.page > DEFAULT_PAGE) {
    params.set("page", String(query.page));
  }
  if (query.pageSize && query.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(query.pageSize));
  }
  if (query.fail === "1") {
    params.set("fail", "1");
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function setProductListSearch(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
  q?: string,
): void {
  const next: ProductListQuery = {
    ...current,
    q: q?.trim() || undefined,
    page: DEFAULT_PAGE,
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
    page: DEFAULT_PAGE,
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
    page: DEFAULT_PAGE,
  };
  router.push(buildProductListUrl(pathname, next));
}

export function setProductListStore(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
  store?: StoreScope,
): void {
  const next: ProductListQuery = {
    ...current,
    store: store && store !== ALL_STORES ? store : ALL_STORES,
    page: DEFAULT_PAGE,
  };
  router.push(buildProductListUrl(pathname, next));
}

export function clearProductListFilters(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
): void {
  const next: ProductListQuery = {
    ...current,
    q: undefined,
    category: undefined,
    status: undefined,
    page: DEFAULT_PAGE,
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
    page: DEFAULT_PAGE,
  };
  router.push(buildProductListUrl(pathname, next));
}

export function toggleProductListSort(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
  column: ProductSortKey,
): void {
  let nextSort: ProductSortKey | undefined = column;
  let nextDir: SortDirection | undefined = SORT_DIRECTION.DESC;

  if (current.sort === column) {
    if (current.dir === SORT_DIRECTION.DESC) {
      nextDir = SORT_DIRECTION.ASC;
    } else {
      nextSort = undefined;
      nextDir = undefined;
    }
  }

  const next: ProductListQuery = {
    ...current,
    sort: nextSort,
    dir: nextDir,
  };
  router.push(buildProductListUrl(pathname, next));
}
