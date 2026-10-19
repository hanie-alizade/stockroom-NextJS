import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import type {
  MovementListQuery,
  MovementListResponse,
  ProductDetail,
  ProductDetailQuery,
  ProductListQuery,
  ProductListResponse,
  StockHistory,
  StockHistoryQuery,
} from "@/types";
import {
  getProductDetail,
  getProductList,
  getProductMovements,
  getStockHistory,
} from "@/api/productsApi";

export function useQueryProductList(
  query: ProductListQuery,
): UseQueryResult<ProductListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => getProductList(query),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useQueryProductDetail(
  id: string,
  query?: ProductDetailQuery,
): UseQueryResult<ProductDetail, Error> {
  return useQuery({
    queryKey: queryKeys.products.detail(id, query),
    queryFn: () => getProductDetail(id, query),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: false,
    enabled: Boolean(id),
  });
}

export function useQueryProductMovements(
  id: string,
  query?: MovementListQuery,
): UseQueryResult<MovementListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.products.movements(id, query),
    queryFn: () => getProductMovements(id, query),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: false,
    enabled: Boolean(id) && (query?.page === undefined || query.page >= 1),
  });
}

export function useQueryStockHistory(
  id: string,
  query?: StockHistoryQuery,
): UseQueryResult<StockHistory, Error> {
  return useQuery({
    queryKey: queryKeys.products.stockHistory(id, query),
    queryFn: () => getStockHistory(id, query),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: false,
    enabled: Boolean(id) && (query?.days === undefined || query.days > 0),
  });
}
