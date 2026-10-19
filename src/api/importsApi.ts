import { IDEMPOTENCY_KEY_HEADER } from "@/constants";
import { axiosInstance } from "./axiosConfig";
import type { ImportCommitResult, ImportValidationResult } from "@/types";

/**
 * Validates an import CSV file and column mapping against inventory.
 */
export async function postImportValidate(
  formData: FormData,
): Promise<ImportValidationResult> {
  const { data } = await axiosInstance.post<ImportValidationResult>(
    "/api/imports/validate",
    formData,
  );
  return data;
}

/**
 * Commits valid import CSV rows into inventory within a transaction.
 */
export async function postImportCommit(
  formData: FormData,
  idempotencyKey: string,
): Promise<ImportCommitResult> {
  const { data } = await axiosInstance.post<ImportCommitResult>(
    "/api/imports/commit",
    formData,
    {
      headers: {
        [IDEMPOTENCY_KEY_HEADER]: idempotencyKey,
      },
    },
  );
  return data;
}
