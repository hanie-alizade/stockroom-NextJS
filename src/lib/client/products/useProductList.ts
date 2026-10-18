import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import type { ProductListQuery, ProductListResponse } from "@/lib/types/product";
import { getProductList } from "./productsApi";

export function useProductList(
  query: ProductListQuery,
): UseQueryResult<ProductListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => getProductList(query),
    placeholderData: (previousData) => previousData,
  });
}
