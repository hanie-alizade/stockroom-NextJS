import "server-only";

import { createHash } from "node:crypto";

import {
  ADJUSTMENT_TYPE,
  ERROR_CODE,
  FIELD_ERROR_CODE,
  HTTP_STATUS,
} from "@/constants";
import { AppError, can, isValidQuantity } from "@/domain";
import type { Repository } from "@/server/repositories";

import { applyDirectAdjustment } from "./applyDirectAdjustment";
import { applyTransfer } from "./applyTransfer";
import { isRecord, isStoredAdjustmentBody } from "./types";

import type { AdjustmentInput, AdjustmentResult, SavedMovement, StoreRecord } from "@/types";
import type { AdjustmentContext, ExecutionContext } from "./types";

export type { AdjustmentContext, AdjustmentInput, AdjustmentResult, SavedMovement };

function canonicalJsonString(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJsonString).join(",") + "]";
  }
  if (isRecord(obj)) {
    const keys = Object.keys(obj).sort();
    return (
      "{" +
      keys.map((key) => JSON.stringify(key) + ":" + canonicalJsonString(obj[key])).join(",") +
      "}"
    );
  }
  return JSON.stringify(obj);
}

export async function createAdjustment(
  repo: Repository,
  productId: string,
  input: AdjustmentInput,
  ctx: AdjustmentContext,
): Promise<AdjustmentResult> {
  if (!ctx.idempotencyKey || ctx.idempotencyKey.trim() === "") {
    throw new AppError(ERROR_CODE.IDEMPOTENCY_KEY_REQUIRED, HTTP_STATUS.BAD_REQUEST, "Missing Idempotency-Key header");
  }

  if (!can(ctx.role, input.type)) {
    throw new AppError(ERROR_CODE.FORBIDDEN, HTTP_STATUS.FORBIDDEN, "You do not have permission to perform this action");
  }

  const product = repo.getProduct(productId);
  if (!product) {
    throw new AppError(ERROR_CODE.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Product not found");
  }
  const canonicalSku = product.sku;

  if (!isValidQuantity(input.quantity)) {
    throw new AppError(ERROR_CODE.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY, "Invalid quantity", [
      {
        field: "quantity",
        code: FIELD_ERROR_CODE.MUST_BE_POSITIVE,
        message: "Quantity must be a positive whole number",
      },
    ]);
  }

  const note = input.note ?? null;
  if (input.type === ADJUSTMENT_TYPE.WRITE_OFF && (!note || note.trim().length < 3)) {
    throw new AppError(ERROR_CODE.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY, "Write-off requires a note", [
      { field: "note", code: FIELD_ERROR_CODE.REQUIRED, message: "Note must be at least 3 characters" },
    ]);
  }

  if (input.type === ADJUSTMENT_TYPE.TRANSFER && input.fromStoreId === input.toStoreId) {
    throw new AppError(ERROR_CODE.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY, "Cannot transfer to the same store", [
      {
        field: "to",
        code: FIELD_ERROR_CODE.SAME_STORE,
        message: "Source and destination stores must be different",
      },
    ]);
  }

  const requestHash = createHash("sha256")
    .update(canonicalJsonString({ productId: canonicalSku, ...input }))
    .digest("hex");

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

    const storeMap = new Map<string, StoreRecord>(txRepo.getStores().map((s) => [s.id, s]));
    const now = new Date().toISOString();
    const users = txRepo.getUsers();
    const user =
      users.find((u) => u.id === ctx.userId) ?? users.find((u) => u.role === ctx.role) ?? users[0];

    const execCtx: ExecutionContext = {
      storeMap,
      requestHash,
      idempotencyKey: ctx.idempotencyKey,
      now,
      userName: user ? user.name : "Unknown",
      userId: user ? user.id : "unknown",
      note,
    };

    if (input.type === ADJUSTMENT_TYPE.TRANSFER) {
      return applyTransfer(txRepo, canonicalSku, input, execCtx);
    }

    return applyDirectAdjustment(txRepo, canonicalSku, input, execCtx);
  });
}
