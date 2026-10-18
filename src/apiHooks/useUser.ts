import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import type { SessionResponse } from "@/api/commonApi";
import { switchUser } from "@/api/commonApi";

export function useMutationSwitchUser(): UseMutationResult<SessionResponse, Error, string> {
  return useMutation({
    mutationFn: switchUser,
  });
}
