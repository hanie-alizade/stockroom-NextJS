import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import type { MetaResponse } from "@/api/commonApi";
import { getMeta } from "@/api/commonApi";

export function useQueryMeta(): UseQueryResult<MetaResponse, Error> {
  return useQuery({
    queryKey: queryKeys.meta.all,
    queryFn: getMeta,
    staleTime: Infinity,
  });
}
