import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants";
import { getAdjustmentToast } from "@/helpers";
import type {
  Adjustment,
  AdjustmentResult,
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
  postAdjustment,
} from "@/api/productsApi";
import { useQueryMeta } from "./useMeta";

export const ADJUST_TOAST_ID = "adjust-stock-toast";


export function useQueryProductList(
  query: ProductListQuery,
): UseQueryResult<ProductListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => getProductList(query),
    placeholderData: (previousData) => previousData,
    meta: { silent: true },
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
    meta: { silent: true },
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
    meta: { silent: true },
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
    meta: { silent: true },
    enabled: Boolean(id) && (query?.days === undefined || query.days > 0),
  });
}

export function useMutationAdjustment(productId: string) {
  const queryClient = useQueryClient();
  const { data: meta } = useQueryMeta();

  return useMutation<
    AdjustmentResult,
    Error,
    { payload: Adjustment; idempotencyKey: string }
  >({
    mutationFn: ({ payload, idempotencyKey }) =>
      postAdjustment(productId, payload, idempotencyKey),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      const toastInfo = getAdjustmentToast(variables.payload, meta?.stores ?? []);
      toast.success(toastInfo.title, {
        id: ADJUST_TOAST_ID,
        description: toastInfo.description,
      });
    },
    onError: (error) => {
      toast.error("Couldn't save", {
        id: ADJUST_TOAST_ID,
        description: error.message,
      });
    },
  });
}

