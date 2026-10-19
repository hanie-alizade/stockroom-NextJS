import "server-only";

import { createHash } from "node:crypto";
import { HTTP_STATUS } from "@/constants";
import type { Repository } from "@/server/repositories";
import type { AdjustmentResult, Movement } from "@/types";
import type { AdjustmentContext } from "./types";

/**
 * Checks whether an unknown value is a non-null object record.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Type guard validating that a stored body matches the serialized adjustment result shape.
 */
export function isStoredAdjustmentBody(
  body: unknown,
): body is { movements: Movement[]; stock: { storeId: string; onHand: number }[] } {
  if (!isRecord(body)) {
    return false;
  }
  return Array.isArray(body.movements) && Array.isArray(body.stock);
}

/**
 * Returns a canonical deterministic JSON string with alphabetically sorted keys.
 */
export function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJson).join(",") + "]";
  }
  if (isRecord(obj)) {
    const keys = Object.keys(obj).sort();
    return (
      "{" + keys.map((key) => JSON.stringify(key) + ":" + canonicalJson(obj[key])).join(",") + "}"
    );
  }
  return JSON.stringify(obj);
}

/**
 * Computes a SHA-256 hash for an adjustment request payload.
 */
export function hashRequest(productId: string, input: unknown): string {
  const payload = isRecord(input) ? { productId, ...input } : { productId, input };
  return createHash("sha256").update(canonicalJson(payload)).digest("hex");
}

/**
 * Persists an adjustment result in the idempotency log.
 */
export function recordResult(
  txRepo: Repository,
  ctx: AdjustmentContext,
  result: AdjustmentResult,
  requestHash?: string,
): void {
  const hash =
    requestHash ?? ctx.requestHash ?? hashRequest(result.movements[0]?.productId ?? "", result);
  txRepo.setIdempotency({
    idempotencyKey: ctx.idempotencyKey,
    requestHash: hash,
    status: HTTP_STATUS.CREATED,
    body: { movements: result.movements, stock: result.stock },
  });
}
