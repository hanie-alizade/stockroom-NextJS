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
  DEV_PARAM,
} from "@/constants";
import type {
  PageSize,
  ProductListQuery,
  ProductSortKey,
  SortDirection,
  StockStatus,
  StoreScope,
} from "@/types";

import { normalizePageSize } from "./pagination";

export interface RouterInstance {
  push: (href: string) => void;
  replace: (href: string) => void;
}

const VALID_SORT_KEYS = new Set<string>(Object.values(PRODUCT_SORT_KEY));

function isProductSortKey(key: string): key is ProductSortKey {
  return VALID_SORT_KEYS.has(key);
}

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

  const sortRaw = getParam(source, "sort");
  const sort: ProductSortKey | undefined =
    sortRaw && isProductSortKey(sortRaw) ? sortRaw : undefined;

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
  const pageSize = normalizePageSize(pageSizeRaw);

  const failRaw = getParam(source, DEV_PARAM.FAIL);
  const fail = failRaw === DEV_PARAM.VALUE ? DEV_PARAM.VALUE : undefined;

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
  if (query.fail === DEV_PARAM.VALUE) {
    params.set(DEV_PARAM.FAIL, DEV_PARAM.VALUE);
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
  const trimmed = q?.trim() || undefined;
  const next: ProductListQuery = {
    ...current,
    q: trimmed,
    page: DEFAULT_PAGE,
  };
  const url = buildProductListUrl(pathname, next);
  const isFirstSearchEntry = !current.q && Boolean(trimmed);
  if (isFirstSearchEntry || !trimmed) {
    router.push(url);
  } else {
    router.replace(url);
  }
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
    page: DEFAULT_PAGE,
  };
  router.push(buildProductListUrl(pathname, next));
}

export function setProductListSort(
  router: RouterInstance,
  pathname: string,
  current: ProductListQuery,
  sort?: ProductSortKey,
  dir?: SortDirection,
): void {
  const next: ProductListQuery = {
    ...current,
    sort,
    dir: sort ? (dir ?? SORT_DIRECTION.DESC) : undefined,
    page: DEFAULT_PAGE,
  };
  router.push(buildProductListUrl(pathname, next));
}

