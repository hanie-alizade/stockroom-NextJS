import { axiosInstance } from "./axiosConfig";
import type { ProductListQuery, ProductListResponse } from "@/types";

export async function getProductList(query: ProductListQuery): Promise<ProductListResponse> {
  const { data } = await axiosInstance.get<ProductListResponse>("/api/products", {
    params: query,
  });
  return data;
}
