import { IDEMPOTENCY_KEY_HEADER } from "@/constants";
import { axiosInstance } from "./axiosConfig";
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

export async function getProductList(query: ProductListQuery): Promise<ProductListResponse> {
  const { data } = await axiosInstance.get<ProductListResponse>("/api/products", {
    params: query,
  });
  return data;
}

export async function getProductDetail(
  id: string,
  query?: ProductDetailQuery,
): Promise<ProductDetail> {
  const { data } = await axiosInstance.get<ProductDetail>(`/api/products/${id}`, {
    params: query,
  });
  return data;
}

export async function getProductMovements(
  id: string,
  query?: MovementListQuery,
): Promise<MovementListResponse> {
  const { data } = await axiosInstance.get<MovementListResponse>(`/api/products/${id}/movements`, {
    params: query,
  });
  return data;
}

export async function getStockHistory(
  id: string,
  query?: StockHistoryQuery,
): Promise<StockHistory> {
  const { data } = await axiosInstance.get<StockHistory>(`/api/products/${id}/stock-history`, {
    params: query,
  });
  return data;
}

export async function postAdjustment(
  productId: string,
  payload: Adjustment,
  idempotencyKey: string,
): Promise<AdjustmentResult> {
  const { data } = await axiosInstance.post<AdjustmentResult>(
    `/api/products/${productId}/adjustments`,
    payload,
    {
      headers: {
        [IDEMPOTENCY_KEY_HEADER]: idempotencyKey,
      },
    },
  );
  return data;
}

