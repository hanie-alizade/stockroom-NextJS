import "server-only";

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
    throw new AppError("STORE_NOT_FOUND", 404, "Store not found");
  }

  const fromStock = txRepo.getStock(canonicalSku, input.fromStoreId);
  const toStock = txRepo.getStock(canonicalSku, input.toStoreId);
  if (!fromStock || !toStock) {
    throw new AppError("NOT_STOCKED_AT_STORE", 422, "Product is not stocked at this store");
  }

  if (fromStock.onHand < input.quantity) {
    throw new AppError(
      "INSUFFICIENT_STOCK",
      409,
      `${fromStore.name} only has ${fromStock.onHand} on hand. Enter ${fromStock.onHand} or less.`,
      [{ field: "quantity", code: "TOO_MANY", message: `Only ${fromStock.onHand} on hand.` }],
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
    type: "transfer_out",
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
    type: "transfer_in",
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
    status: 201,
    body: { movements: adjustmentResult.movements, stock: adjustmentResult.stock },
  });

  return adjustmentResult;
}
