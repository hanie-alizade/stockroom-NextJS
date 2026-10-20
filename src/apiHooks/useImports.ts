import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { postImportCommit, postImportValidate } from "@/api";
import type { ImportCommitResult, ImportValidationResult } from "@/types";

/**
 * Mutation hook for validating an import file. Meta silent prevents global error toasts.
 */
export function useMutationValidateImport(): UseMutationResult<
  ImportValidationResult,
  Error,
  FormData
> {
  return useMutation({
    mutationFn: (formData: FormData) => postImportValidate(formData),
    retry: false,
    meta: { silent: true },
  });
}

/**
 * Mutation hook for committing an import file into inventory.
 */
export function useMutationCommitImport(): UseMutationResult<
  ImportCommitResult,
  Error,
  { formData: FormData; idempotencyKey: string }
> {
  return useMutation({
    mutationFn: ({ formData, idempotencyKey }) =>
      postImportCommit(formData, idempotencyKey),
    meta: { silent: true },
  });
}
