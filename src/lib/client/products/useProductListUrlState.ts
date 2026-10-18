"use client";

import { useMemo, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseProductListParams,
  setProductListSearch,
  setProductListCategory,
  setProductListStatus,
  setProductListPage,
  setProductListPageSize,
  toggleProductListSort,
} from "./productListUrlState";
import type { StockStatus, ProductSortKey, PageSize } from "@/types";

export function useProductListUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(() => parseProductListParams(searchParams), [searchParams]);

  const setSearch = useCallback(
    (q: string) => {
      setProductListSearch(router, pathname, query, q);
    },
    [router, pathname, query],
  );

  const setCategory = useCallback(
    (category?: string) => {
      setProductListCategory(router, pathname, query, category);
    },
    [router, pathname, query],
  );

  const setStatus = useCallback(
    (status?: StockStatus) => {
      setProductListStatus(router, pathname, query, status);
    },
    [router, pathname, query],
  );

  const setPage = useCallback(
    (page: number) => {
      setProductListPage(router, pathname, query, page);
    },
    [router, pathname, query],
  );

  const setPageSize = useCallback(
    (pageSize: PageSize) => {
      setProductListPageSize(router, pathname, query, pageSize);
    },
    [router, pathname, query],
  );

  const toggleSort = useCallback(
    (column: ProductSortKey) => {
      toggleProductListSort(router, pathname, query, column);
    },
    [router, pathname, query],
  );

  return {
    query,
    setSearch,
    setCategory,
    setStatus,
    setPage,
    setPageSize,
    toggleSort,
  };
}
