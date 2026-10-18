import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import type { ProductListQuery, ProductListResponse } from "@/types";
import { getProductList } from "@/api/productsApi";

export function useQueryProductList(
  query: ProductListQuery,
): UseQueryResult<ProductListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => getProductList(query),
    placeholderData: (previousData) => previousData,
  });
}
