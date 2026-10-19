"use client";

import { useMemo, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  clearProductDetailMovementsFilters,
  parseProductDetailParams,
  setProductDetailPage,
  setProductDetailPageSize,
  setProductDetailPeriod,
  setProductDetailStore,
  setProductDetailTab,
  setProductDetailType,
} from "@/helpers";
import type { DetailTab } from "@/constants";
import type { MovementPeriod, MovementType, PageSize, StoreScope } from "@/types";

export function useProductDetailUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(() => parseProductDetailParams(searchParams), [searchParams]);

  const setStore = useCallback(
    (store?: StoreScope) => {
      setProductDetailStore(router, pathname, query, store);
    },
    [router, pathname, query],
  );

  const setTab = useCallback(
    (tab: DetailTab) => {
      setProductDetailTab(router, pathname, query, tab);
    },
    [router, pathname, query],
  );

  const setType = useCallback(
    (type?: MovementType) => {
      setProductDetailType(router, pathname, query, type);
    },
    [router, pathname, query],
  );

  const setPeriod = useCallback(
    (period: MovementPeriod) => {
      setProductDetailPeriod(router, pathname, query, period);
    },
    [router, pathname, query],
  );

  const clearFilters = useCallback(() => {
    clearProductDetailMovementsFilters(router, pathname, query);
  }, [router, pathname, query]);

  const setPage = useCallback(
    (page: number) => {
      setProductDetailPage(router, pathname, query, page);
    },
    [router, pathname, query],
  );

  const setPageSize = useCallback(
    (pageSize: PageSize) => {
      setProductDetailPageSize(router, pathname, query, pageSize);
    },
    [router, pathname, query],
  );

  return {
    query,
    setStore,
    setTab,
    setType,
    setPeriod,
    clearFilters,
    setPage,
    setPageSize,
  };
}
