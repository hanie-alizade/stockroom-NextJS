import "server-only";

import {
  ADJUSTMENT_TYPE,
  ERROR_CODE,
  FIELD_ERROR_CODE,
  HTTP_STATUS,
} from "@/constants";
import { AppError } from "@/domain";

import type { Repository } from "@/server/repositories";
import type {
  AdjustmentResult,
  ReceiveAdjustment,
  SellAdjustment,
  WriteOffAdjustment,
} from "@/types";
import type { ExecutionContext } from "./types";

export type DirectAdjustment = ReceiveAdjustment | SellAdjustment | WriteOffAdjustment;

export function applyDirectAdjustment(
  txRepo: Repository,
  canonicalSku: string,
  input: DirectAdjustment,
  ctx: ExecutionContext,
): AdjustmentResult {
  const store = ctx.storeMap.get(input.storeId);
  if (!store) {
    throw new AppError(ERROR_CODE.STORE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Store not found");
  }
  const stock = txRepo.getStock(canonicalSku, input.storeId);
  if (!stock) {
    throw new AppError(ERROR_CODE.NOT_STOCKED_AT_STORE, HTTP_STATUS.UNPROCESSABLE_ENTITY, "Product is not stocked at this store");
  }
  if ((input.type === ADJUSTMENT_TYPE.SELL || input.type === ADJUSTMENT_TYPE.WRITE_OFF) && stock.onHand < input.quantity) {
    throw new AppError(
      ERROR_CODE.INSUFFICIENT_STOCK,
      HTTP_STATUS.CONFLICT,
      `${store.name} only has ${stock.onHand} on hand. Enter ${stock.onHand} or less.`,
      [{ field: "quantity", code: FIELD_ERROR_CODE.TOO_MANY, message: `Only ${stock.onHand} on hand.` }],
    );
  }

  const delta = input.type === ADJUSTMENT_TYPE.RECEIVE ? input.quantity : -input.quantity;
  const newOnHand = stock.onHand + delta;
  txRepo.setStock(canonicalSku, input.storeId, newOnHand, stock.reorderLevel);

  const savedMovement = txRepo.addMovement({
    productId: canonicalSku,
    storeId: input.storeId,
    type: input.type,
    quantity: delta,
    balanceAfter: newOnHand,
    reason: ctx.note,
    transferId: null,
    createdAt: ctx.now,
    userId: ctx.userId,
  });

  const adjustmentResult: AdjustmentResult = {
    replay: false,
    movements: [
      {
        ...savedMovement,
        note: savedMovement.reason ?? undefined,
        createdBy: ctx.userName,
        by: ctx.userName,
      },
    ],
    stock: [{ storeId: input.storeId, onHand: newOnHand }],
  };

  txRepo.setIdempotency({
    idempotencyKey: ctx.idempotencyKey,
    requestHash: ctx.requestHash,
    status: HTTP_STATUS.CREATED,
    body: { movements: adjustmentResult.movements, stock: adjustmentResult.stock },
  });

  return adjustmentResult;
}
