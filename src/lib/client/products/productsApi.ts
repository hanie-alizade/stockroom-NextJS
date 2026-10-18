import { apiClient } from "@/lib/client/api/client";
import type { ProductListQuery, ProductListResponse } from "@/types";

export async function getProductList(query: ProductListQuery): Promise<ProductListResponse> {
  const { data } = await apiClient.get<ProductListResponse>("/api/products", {
    params: query,
  });
  return data;
}
