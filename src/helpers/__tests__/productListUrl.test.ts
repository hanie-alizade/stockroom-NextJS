import { describe, expect, it, vi } from "vitest";
import {
  ALL_STORES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  PRODUCT_SORT_KEY,
  SORT_DIRECTION,
  STOCK_STATUS,
  STORE_ID,
} from "@/constants";
import type { ProductListQuery } from "@/types";
import {
  buildProductListUrl,
  clearProductListFilters,
  parseProductListParams,
  setProductListCategory,
  setProductListPage,
  setProductListPageSize,
  setProductListSearch,
  setProductListSort,
  setProductListStatus,
  setProductListStore,
  toggleProductListSort,
} from "../productListUrl";

describe("productListUrl", () => {
  describe("parseProductListParams", () => {
    it("returns default values when params are empty", () => {
      const parsed = parseProductListParams({});
      expect(parsed).toEqual({
        store: ALL_STORES,
        q: undefined,
        category: undefined,
        status: undefined,
        sort: undefined,
        dir: undefined,
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
        fail: undefined,
      });
    });

    it("falls back to defaults for invalid values", () => {
      const parsed = parseProductListParams({
        store: "all",
        category: "all",
        status: "invalid_status",
        sort: "invalid_sort",
        dir: "invalid_dir",
        page: "-5",
        pageSize: "99",
        fail: "2",
      });

      expect(parsed).toEqual({
        store: ALL_STORES,
        q: undefined,
        category: undefined,
        status: undefined,
        sort: undefined,
        dir: undefined,
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
        fail: undefined,
      });
    });

    it("parses valid non-default params correctly", () => {
      const parsed = parseProductListParams({
        store: STORE_ID.MONT_KIARA,
        q: "arabica",
        category: "Coffee",
        status: STOCK_STATUS.LOW,
        sort: PRODUCT_SORT_KEY.ON_HAND,
        dir: SORT_DIRECTION.ASC,
        page: "2",
        pageSize: "50",
        fail: "1",
      });

      expect(parsed).toEqual({
        store: STORE_ID.MONT_KIARA,
        q: "arabica",
        category: "Coffee",
        status: STOCK_STATUS.LOW,
        sort: PRODUCT_SORT_KEY.ON_HAND,
        dir: SORT_DIRECTION.ASC,
        page: 2,
        pageSize: 50,
        fail: "1",
      });
    });
  });

  describe("buildProductListUrl", () => {
    it("returns pathname when query contains only defaults", () => {
      const url = buildProductListUrl("/products", {
        store: ALL_STORES,
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      expect(url).toBe("/products");
    });

    it("includes non-default parameters in query string", () => {
      const url = buildProductListUrl("/products", {
        store: STORE_ID.SUBANG,
        q: "syrup",
        category: "Syrups",
        status: STOCK_STATUS.OUT,
        sort: PRODUCT_SORT_KEY.NAME,
        dir: SORT_DIRECTION.ASC,
        page: 3,
        pageSize: 100,
        fail: "1",
      });
      expect(url).toBe(
        "/products?store=subang&q=syrup&category=Syrups&status=out&sort=name&dir=asc&page=3&pageSize=100&fail=1",
      );
    });
  });

  describe("router navigation helpers", () => {
    const mockRouter = {
      push: vi.fn(),
      replace: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    const initialQuery: ProductListQuery = {
      store: STORE_ID.MONT_KIARA,
      category: "Coffee",
      status: STOCK_STATUS.LOW,
      sort: PRODUCT_SORT_KEY.NAME,
      dir: SORT_DIRECTION.ASC,
      page: 3,
      pageSize: 50,
    };

    it("setProductListSearch uses push on first search entry and resets page to 1", () => {
      const noSearchQuery: ProductListQuery = { ...initialQuery, q: undefined };
      setProductListSearch(mockRouter, "/products", noSearchQuery, "arabica");
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&q=arabica&category=Coffee&status=low&sort=name&dir=asc&pageSize=50",
      );
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it("setProductListSearch uses replace for subsequent search typing and resets page to 1", () => {
      const existingSearchQuery: ProductListQuery = {
        ...initialQuery,
        q: "arabica",
      };
      setProductListSearch(mockRouter, "/products", existingSearchQuery, "arabica beans");
      expect(mockRouter.replace).toHaveBeenCalledWith(
        "/products?store=mont-kiara&q=arabica+beans&category=Coffee&status=low&sort=name&dir=asc&pageSize=50",
      );
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("setProductListSearch uses push when clearing search query", () => {
      const existingSearchQuery: ProductListQuery = {
        ...initialQuery,
        q: "arabica",
      };
      setProductListSearch(mockRouter, "/products", existingSearchQuery, "");
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&category=Coffee&status=low&sort=name&dir=asc&pageSize=50",
      );
    });

    it("setProductListCategory resets page to 1 and calls router.push", () => {
      setProductListCategory(mockRouter, "/products", initialQuery, "Syrups");
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&category=Syrups&status=low&sort=name&dir=asc&pageSize=50",
      );
    });

    it("setProductListStatus resets page to 1 and calls router.push", () => {
      setProductListStatus(mockRouter, "/products", initialQuery, STOCK_STATUS.OUT);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&category=Coffee&status=out&sort=name&dir=asc&pageSize=50",
      );
    });

    it("setProductListStore resets page to 1 and calls router.push", () => {
      setProductListStore(mockRouter, "/products", initialQuery, STORE_ID.CHERAS);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=cheras&category=Coffee&status=low&sort=name&dir=asc&pageSize=50",
      );
    });

    it("clearProductListFilters resets filters and page to 1, retaining store and page size", () => {
      clearProductListFilters(mockRouter, "/products", {
        ...initialQuery,
        q: "latte",
      });
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&sort=name&dir=asc&pageSize=50",
      );
    });

    it("setProductListPage updates page and calls router.push", () => {
      setProductListPage(mockRouter, "/products", initialQuery, 5);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&category=Coffee&status=low&sort=name&dir=asc&page=5&pageSize=50",
      );
    });

    it("setProductListPageSize resets page to 1 and calls router.push", () => {
      setProductListPageSize(mockRouter, "/products", initialQuery, 100);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&category=Coffee&status=low&sort=name&dir=asc&pageSize=100",
      );
    });

    it("toggleProductListSort resets page to 1 and cycles sort direction (desc -> asc -> off)", () => {
      // Different column starts desc
      toggleProductListSort(mockRouter, "/products", initialQuery, PRODUCT_SORT_KEY.ON_HAND);
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&category=Coffee&status=low&sort=onHand&dir=desc&pageSize=50",
      );

      // Same column currently desc switches to asc
      toggleProductListSort(
        mockRouter,
        "/products",
        {
          ...initialQuery,
          sort: PRODUCT_SORT_KEY.NAME,
          dir: SORT_DIRECTION.DESC,
        },
        PRODUCT_SORT_KEY.NAME,
      );
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&category=Coffee&status=low&sort=name&dir=asc&pageSize=50",
      );

      // Same column currently asc turns sort off
      toggleProductListSort(
        mockRouter,
        "/products",
        {
          ...initialQuery,
          sort: PRODUCT_SORT_KEY.NAME,
          dir: SORT_DIRECTION.ASC,
        },
        PRODUCT_SORT_KEY.NAME,
      );
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&category=Coffee&status=low&pageSize=50",
      );
    });

    it("setProductListSort resets page to 1 and calls router.push", () => {
      setProductListSort(
        mockRouter,
        "/products",
        initialQuery,
        PRODUCT_SORT_KEY.UNIT_COST_SEN,
        SORT_DIRECTION.DESC,
      );
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/products?store=mont-kiara&category=Coffee&status=low&sort=unitCostSen&dir=desc&pageSize=50",
      );
    });
  });
});
