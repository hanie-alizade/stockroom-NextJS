"use client";

import { useCallback, useRef } from "react";
import { ApiError } from "@/api/axiosConfig";
import type { Adjustment } from "@/types";

export interface UseIdempotencyKeyReturn {
  getKey: (payload: Adjustment) => string;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  reset: () => void;
}

/**
 * Manages an idempotency key for adjustment submissions.
 *
 * - Generates one UUID (crypto.randomUUID) per payload.
 * - Reuses the key on retry if the payload is unchanged after an ambiguous error (network error, timeout, 5xx).
 * - Creates a fresh key on the next submit after success, when the payload changes, or after a definitive 4xx error.
 */
export function useIdempotencyKey(): UseIdempotencyKeyReturn {
  const keyRef = useRef<string | null>(null);
  const lastPayloadJsonRef = useRef<string | null>(null);

  const getKey = useCallback((payload: Adjustment): string => {
    const serialized = JSON.stringify(payload);
    if (serialized !== lastPayloadJsonRef.current || !keyRef.current) {
      keyRef.current = crypto.randomUUID();
      lastPayloadJsonRef.current = serialized;
    }
    return keyRef.current;
  }, []);

  const reset = useCallback(() => {
    keyRef.current = null;
    lastPayloadJsonRef.current = null;
  }, []);

  const onSuccess = useCallback(() => {
    reset();
  }, [reset]);

  const onError = useCallback((error: unknown) => {
    // Definitive 4xx errors (409, 422, 403, etc.):
    // The server reached a definitive decision; subsequent submissions may differ.
    // Ambiguous outcomes (network error, timeout, 5xx) retain the key for retries.
    if (error instanceof ApiError && typeof error.status === "number") {
      if (error.status >= 400 && error.status < 500) {
        reset();
      }
    }
  }, [reset]);

  return {
    getKey,
    onSuccess,
    onError,
    reset,
  };
}
