import { describe, expect, it, vi } from "vitest";
import {
  ALL_STORES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DETAIL_TAB,
  MOVEMENT_TYPE,
  PERIOD,
  STORE_ID,
} from "@/constants";
import {
  buildProductDetailUrl,
  clearProductDetailMovementsFilters,
  parseProductDetailParams,
  setProductDetailPage,
  setProductDetailPageSize,
  setProductDetailPeriod,
  setProductDetailStore,
  setProductDetailTab,
  setProductDetailType,
} from "../productDetailUrl";

describe("productDetailUrl", () => {
  describe("parseProductDetailParams", () => {
    it("returns default values when params are empty", () => {
      const parsed = parseProductDetailParams({});
      expect(parsed).toEqual({
        store: ALL_STORES,
        tab: DETAIL_TAB.OVERVIEW,
        type: undefined,
        period: PERIOD.DAYS_30,
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
        fail: undefined,
      });
    });

    it("falls back to defaults for invalid values", () => {
      const parsed = parseProductDetailParams({
        store: "xyz",
        tab: "foo",
        period: "1y",
        page: "-1",
        pageSize: "7",
        type: "bad",
      });

      expect(parsed).toEqual({
        store: ALL_STORES,
        tab: DETAIL_TAB.OVERVIEW,
        type: undefined,
        period: PERIOD.DAYS_30,
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
        fail: undefined,
      });
    });

    it("parses valid non-default values correctly", () => {
      const parsed = parseProductDetailParams({
        store: STORE_ID.SUBANG,
        tab: DETAIL_TAB.MOVEMENTS,
        type: MOVEMENT_TYPE.SELL,
        period: PERIOD.DAYS_7,
        page: "3",
        pageSize: "25",
        fail: "1",
      });

      expect(parsed).toEqual({
        store: STORE_ID.SUBANG,
        tab: DETAIL_TAB.MOVEMENTS,
        type: MOVEMENT_TYPE.SELL,
        period: PERIOD.DAYS_7,
        page: 3,
        pageSize: 25,
        fail: "1",
      });
    });
  });

  describe("buildProductDetailUrl", () => {
    it("writes nothing extra when all values are defaults", () => {
      const url = buildProductDetailUrl("/products/KL-1042", {
        store: ALL_STORES,
        tab: DETAIL_TAB.OVERVIEW,
        type: undefined,
        period: PERIOD.DAYS_30,
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
      });

      expect(url).toBe("/products/KL-1042");
    });

    it("writes only non-default values", () => {
      const url = buildProductDetailUrl("/products/KL-1042", {
        store: STORE_ID.MONT_KIARA,
        tab: DETAIL_TAB.OVERVIEW,
        type: undefined,
        period: PERIOD.DAYS_30,
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
      });

      expect(url).toBe("/products/KL-1042?store=mont-kiara");
    });

    it("includes tab, type, period, page, pageSize, and fail when non-default", () => {
      const url = buildProductDetailUrl("/products/KL-1042", {
        store: STORE_ID.CHERAS,
        tab: DETAIL_TAB.MOVEMENTS,
        type: MOVEMENT_TYPE.TRANSFER_OUT,
        period: PERIOD.DAYS_90,
        page: 2,
        pageSize: 50,
        fail: "1",
      });

      expect(url).toBe(
        "/products/KL-1042?store=cheras&tab=movements&type=transfer_out&period=90d&page=2&pageSize=50&fail=1",
      );
    });
  });

  describe("navigation helpers", () => {
    const mockRouter = {
      push: vi.fn(),
      replace: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    const initialQuery = {
      store: ALL_STORES,
      tab: DETAIL_TAB.MOVEMENTS,
      type: MOVEMENT_TYPE.SELL,
      period: PERIOD.DAYS_90,
      page: 3,
      pageSize: 25 as const,
    };

    it("setProductDetailStore resets page and calls router.push", () => {
      setProductDetailStore(mockRouter, "/products/KL-1042", initialQuery, STORE_ID.SUBANG);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products/KL-1042?store=subang&tab=movements&type=sell&period=90d",
      );
    });

    it("setProductDetailType resets page and calls router.push", () => {
      setProductDetailType(mockRouter, "/products/KL-1042", initialQuery, MOVEMENT_TYPE.RECEIVE);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products/KL-1042?tab=movements&type=receive&period=90d",
      );
    });

    it("setProductDetailPeriod resets page and calls router.push", () => {
      setProductDetailPeriod(mockRouter, "/products/KL-1042", initialQuery, PERIOD.DAYS_7);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products/KL-1042?tab=movements&type=sell&period=7d",
      );
    });

    it("setProductDetailPageSize resets page and calls router.push", () => {
      setProductDetailPageSize(mockRouter, "/products/KL-1042", initialQuery, 50);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products/KL-1042?tab=movements&type=sell&period=90d&pageSize=50",
      );
    });

    it("clearProductDetailMovementsFilters resets type, period, page and calls router.push", () => {
      clearProductDetailMovementsFilters(mockRouter, "/products/KL-1042", {
        ...initialQuery,
        store: STORE_ID.CHERAS,
      });
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products/KL-1042?store=cheras&tab=movements",
      );
    });

    it("setProductDetailTab retains other params and calls router.push", () => {
      setProductDetailTab(mockRouter, "/products/KL-1042", initialQuery, DETAIL_TAB.OVERVIEW);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products/KL-1042?type=sell&period=90d&page=3",
      );
    });

    it("setProductDetailPage updates page without changing other params", () => {
      setProductDetailPage(mockRouter, "/products/KL-1042", initialQuery, 4);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products/KL-1042?tab=movements&type=sell&period=90d&page=4",
      );
    });
  });
});
