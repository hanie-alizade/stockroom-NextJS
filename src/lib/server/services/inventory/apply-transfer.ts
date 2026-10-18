import "server-only";

import {
  ERROR_CODE,
  FIELD_ERROR_CODE,
  HTTP_STATUS,
  MOVEMENT_TYPE,
} from "@/constants";
import { AppError } from "@/lib/domain/errors";

import type { Repository } from "@/lib/server/repo";
import type { AdjustmentResult, ExecutionContext, TransferAdjustment } from "./types";

export function applyTransfer(
  txRepo: Repository,
  canonicalSku: string,
  input: TransferAdjustment,
  ctx: ExecutionContext,
): AdjustmentResult {
  const fromStore = ctx.storeMap.get(input.fromStoreId);
  const toStore = ctx.storeMap.get(input.toStoreId);
  if (!fromStore || !toStore) {
    throw new AppError(ERROR_CODE.STORE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Store not found");
  }

  const fromStock = txRepo.getStock(canonicalSku, input.fromStoreId);
  const toStock = txRepo.getStock(canonicalSku, input.toStoreId);
  if (!fromStock || !toStock) {
    throw new AppError(ERROR_CODE.NOT_STOCKED_AT_STORE, HTTP_STATUS.UNPROCESSABLE_ENTITY, "Product is not stocked at this store");
  }

  if (fromStock.onHand < input.quantity) {
    throw new AppError(
      ERROR_CODE.INSUFFICIENT_STOCK,
      HTTP_STATUS.CONFLICT,
      `${fromStore.name} only has ${fromStock.onHand} on hand. Enter ${fromStock.onHand} or less.`,
      [{ field: "quantity", code: FIELD_ERROR_CODE.TOO_MANY, message: `Only ${fromStock.onHand} on hand.` }],
    );
  }

  const transferId = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const transferNote = ctx.note ?? "Stock transfer";
  const fromNewOnHand = fromStock.onHand - input.quantity;
  const toNewOnHand = toStock.onHand + input.quantity;

  txRepo.setStock(canonicalSku, input.fromStoreId, fromNewOnHand, fromStock.reorderLevel);
  txRepo.setStock(canonicalSku, input.toStoreId, toNewOnHand, toStock.reorderLevel);

  const outMovement = txRepo.addMovement({
    productId: canonicalSku,
    storeId: input.fromStoreId,
    type: MOVEMENT_TYPE.TRANSFER_OUT,
    quantity: -input.quantity,
    balanceAfter: fromNewOnHand,
    reason: transferNote,
    transferId,
    createdAt: ctx.now,
    userId: ctx.userId,
  });

  const inMovement = txRepo.addMovement({
    productId: canonicalSku,
    storeId: input.toStoreId,
    type: MOVEMENT_TYPE.TRANSFER_IN,
    quantity: input.quantity,
    balanceAfter: toNewOnHand,
    reason: transferNote,
    transferId,
    createdAt: ctx.now,
    userId: ctx.userId,
  });

  const adjustmentResult: AdjustmentResult = {
    replay: false,
    movements: [
      { ...outMovement, note: transferNote, createdBy: ctx.userName, by: ctx.userName },
      { ...inMovement, note: transferNote, createdBy: ctx.userName, by: ctx.userName },
    ],
    stock: [
      { storeId: input.fromStoreId, onHand: fromNewOnHand },
      { storeId: input.toStoreId, onHand: toNewOnHand },
    ],
  };

  txRepo.setIdempotency({
    idempotencyKey: ctx.idempotencyKey,
    requestHash: ctx.requestHash,
    status: HTTP_STATUS.CREATED,
    body: { movements: adjustmentResult.movements, stock: adjustmentResult.stock },
  });

  return adjustmentResult;
}
