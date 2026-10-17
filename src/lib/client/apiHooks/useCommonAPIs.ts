import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/constants/query-keys";
import type { MetaResponse, SessionResponse } from "../api";
import { getMeta, switchUser } from "../api";

export function useQueryMeta(): UseQueryResult<MetaResponse, Error> {
  return useQuery({
    queryKey: queryKeys.meta.all,
    queryFn: getMeta,
    staleTime: Infinity,
  });
}

export function useMutationSwitchUser(): UseMutationResult<SessionResponse, Error, string> {
  return useMutation({
    mutationFn: switchUser,
  });
}
