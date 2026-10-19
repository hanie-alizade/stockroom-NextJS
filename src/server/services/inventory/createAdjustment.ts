import "server-only";

import {
  ADJUSTMENT_PERMISSION,
  ADJUSTMENT_TYPE,
  ERROR_CODE,
  FIELD_ERROR_CODE,
  HTTP_STATUS,
} from "@/constants";
import { AppError, isValidQuantity, roleHasPermission } from "@/domain";
import type { Repository } from "@/server/repositories";
import type { AdjustmentInput, AdjustmentResult } from "@/types";

import { applyDirectAdjustment } from "./applyDirectAdjustment";
import { applyTransfer } from "./applyTransfer";
import { hashRequest, isStoredAdjustmentBody } from "./idempotency";
import type { AdjustmentContext } from "./types";

export type { AdjustmentContext, AdjustmentInput, AdjustmentResult };

/**
 * Creates and processes a stock adjustment with validation, authorization, and idempotency checks.
 */
export async function createAdjustment(
  repo: Repository,
  productId: string,
  input: AdjustmentInput,
  ctx: AdjustmentContext,
): Promise<AdjustmentResult> {
  if (!ctx.idempotencyKey || ctx.idempotencyKey.trim() === "") {
    throw new AppError(
      ERROR_CODE.IDEMPOTENCY_KEY_REQUIRED,
      HTTP_STATUS.BAD_REQUEST,
      "Missing Idempotency-Key header",
    );
  }

  const permission = ADJUSTMENT_PERMISSION[input.type];
  if (!roleHasPermission(ctx.user.role, permission)) {
    throw new AppError(
      ERROR_CODE.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
      "You do not have permission to perform this action",
    );
  }

  const product = repo.getProduct(productId);
  if (!product) {
    throw new AppError(ERROR_CODE.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Product not found");
  }
  const canonicalSku = product.sku;

  if (!isValidQuantity(input.quantity)) {
    throw new AppError(
      ERROR_CODE.VALIDATION_ERROR,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Invalid quantity",
      [
        {
          field: "quantity",
          code: FIELD_ERROR_CODE.MUST_BE_POSITIVE,
          message: "Quantity must be a positive whole number",
        },
      ],
    );
  }

  const note = input.note ?? null;
  if (input.type === ADJUSTMENT_TYPE.WRITE_OFF && (!note || note.trim().length < 3)) {
    throw new AppError(
      ERROR_CODE.VALIDATION_ERROR,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Write-off requires a note",
      [
        {
          field: "note",
          code: FIELD_ERROR_CODE.REQUIRED,
          message: "Note must be at least 3 characters",
        },
      ],
    );
  }

  if (input.type === ADJUSTMENT_TYPE.TRANSFER && input.fromStoreId === input.toStoreId) {
    throw new AppError(
      ERROR_CODE.VALIDATION_ERROR,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Cannot transfer to the same store",
      [
        {
          field: "to",
          code: FIELD_ERROR_CODE.SAME_STORE,
          message: "Source and destination stores must be different",
        },
      ],
    );
  }

  const requestHash = hashRequest(canonicalSku, input);

  return repo.transaction((txRepo) => {
    const existing = txRepo.getIdempotency(ctx.idempotencyKey);
    if (existing) {
      if (existing.requestHash === requestHash && isStoredAdjustmentBody(existing.body)) {
        return {
          replay: true,
          movements: existing.body.movements,
          stock: existing.body.stock,
        };
      }
      throw new AppError(
        ERROR_CODE.IDEMPOTENCY_KEY_REUSED,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "Idempotency key has already been used with a different request payload",
      );
    }

    const nowIso = (ctx.now ?? new Date()).toISOString();
    const userMap = new Map(txRepo.getUsers().map((u) => [u.id, u]));
    userMap.set(ctx.user.id, ctx.user);

    const callCtx: AdjustmentContext = {
      ...ctx,
      requestHash,
    };

    if (input.type === ADJUSTMENT_TYPE.TRANSFER) {
      return applyTransfer(txRepo, canonicalSku, input, callCtx, nowIso, userMap);
    }

    return applyDirectAdjustment(txRepo, canonicalSku, input, callCtx, nowIso, userMap);
  });
}
