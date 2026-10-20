import {
  ALL_STORES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DETAIL_TAB,
  MOVEMENT_TYPE,
  PAGE_SIZE_OPTIONS,
  PERIOD,
  STORE_IDS,
  DEV_PARAM,
} from "@/constants";
import type { DetailTab } from "@/constants";
import type {
  MovementPeriod,
  MovementType,
  PageSize,
  StoreScope,
} from "@/types";

import type { RouterInstance } from "./productListUrl";

import { normalizePageSize } from "./pagination";

export interface ProductDetailUrlQuery {
  store: StoreScope;
  tab: DetailTab;
  type?: MovementType;
  period: MovementPeriod;
  page: number;
  pageSize: PageSize;
  fail?: string;
}

const VALID_MOVEMENT_TYPES = new Set<string>(Object.values(MOVEMENT_TYPE));
const VALID_PERIODS = new Set<string>(Object.values(PERIOD));
const VALID_STORE_IDS = new Set<string>(STORE_IDS);

function isMovementType(key: string): key is MovementType {
  return VALID_MOVEMENT_TYPES.has(key);
}

function isMovementPeriod(key: string): key is MovementPeriod {
  return VALID_PERIODS.has(key);
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

export function parseProductDetailParams(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
): ProductDetailUrlQuery {
  const storeRaw = getParam(source, "store");
  const store: StoreScope =
    storeRaw && storeRaw !== ALL_STORES && VALID_STORE_IDS.has(storeRaw)
      ? storeRaw
      : ALL_STORES;

  const tabRaw = getParam(source, "tab");
  const tab: DetailTab =
    tabRaw === DETAIL_TAB.MOVEMENTS ? DETAIL_TAB.MOVEMENTS : DETAIL_TAB.OVERVIEW;

  const typeRaw = getParam(source, "type");
  const type: MovementType | undefined =
    typeRaw && isMovementType(typeRaw) ? typeRaw : undefined;

  const periodRaw = getParam(source, "period");
  const period: MovementPeriod =
    periodRaw && isMovementPeriod(periodRaw) ? periodRaw : PERIOD.DAYS_30;

  const pageRaw = Number(getParam(source, "page"));
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : DEFAULT_PAGE;

  const pageSizeRaw = Number(getParam(source, "pageSize"));
  const pageSize = normalizePageSize(pageSizeRaw);

  const failRaw = getParam(source, DEV_PARAM.FAIL);
  const fail = failRaw === DEV_PARAM.VALUE ? DEV_PARAM.VALUE : undefined;

  return {
    store,
    tab,
    type,
    period,
    page,
    pageSize,
    fail,
  };
}

export function buildProductDetailUrl(pathname: string, query: ProductDetailUrlQuery): string {
  const params = new URLSearchParams();

  if (query.store && query.store !== ALL_STORES) {
    params.set("store", query.store);
  }
  if (query.tab && query.tab !== DETAIL_TAB.OVERVIEW) {
    params.set("tab", query.tab);
  }
  if (query.type) {
    params.set("type", query.type);
  }
  if (query.period && query.period !== PERIOD.DAYS_30) {
    params.set("period", query.period);
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

export function setProductDetailStore(
  router: RouterInstance,
  pathname: string,
  current: ProductDetailUrlQuery,
  store?: StoreScope,
): void {
  const next: ProductDetailUrlQuery = {
    ...current,
    store: store && store !== ALL_STORES ? store : ALL_STORES,
    page: DEFAULT_PAGE,
  };
  router.push(buildProductDetailUrl(pathname, next));
}

export function setProductDetailTab(
  router: RouterInstance,
  pathname: string,
  current: ProductDetailUrlQuery,
  tab: DetailTab,
): void {
  const next: ProductDetailUrlQuery = {
    ...current,
    tab,
  };
  router.push(buildProductDetailUrl(pathname, next));
}

export function setProductDetailType(
  router: RouterInstance,
  pathname: string,
  current: ProductDetailUrlQuery,
  type?: MovementType,
): void {
  const next: ProductDetailUrlQuery = {
    ...current,
    type,
    page: DEFAULT_PAGE,
  };
  router.push(buildProductDetailUrl(pathname, next));
}

export function setProductDetailPeriod(
  router: RouterInstance,
  pathname: string,
  current: ProductDetailUrlQuery,
  period: MovementPeriod,
): void {
  const next: ProductDetailUrlQuery = {
    ...current,
    period,
    page: DEFAULT_PAGE,
  };
  router.push(buildProductDetailUrl(pathname, next));
}

export function clearProductDetailMovementsFilters(
  router: RouterInstance,
  pathname: string,
  current: ProductDetailUrlQuery,
): void {
  const next: ProductDetailUrlQuery = {
    ...current,
    type: undefined,
    period: PERIOD.DAYS_30,
    page: DEFAULT_PAGE,
  };
  router.push(buildProductDetailUrl(pathname, next));
}

export function setProductDetailPage(
  router: RouterInstance,
  pathname: string,
  current: ProductDetailUrlQuery,
  page: number,
  replace = false,
): void {
  const next: ProductDetailUrlQuery = {
    ...current,
    page,
  };
  const navigate = replace ? router.replace : router.push;
  navigate(buildProductDetailUrl(pathname, next));
}

export function setProductDetailPageSize(
  router: RouterInstance,
  pathname: string,
  current: ProductDetailUrlQuery,
  pageSize: PageSize,
): void {
  const next: ProductDetailUrlQuery = {
    ...current,
    pageSize,
    page: DEFAULT_PAGE,
  };
  router.push(buildProductDetailUrl(pathname, next));
}
