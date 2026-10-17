import "server-only";

import { AppError } from "@/lib/domain/errors";

import type { Repository } from "@/lib/server/repo";
import type {
  AdjustmentResult,
  ExecutionContext,
  ReceiveAdjustment,
  SellAdjustment,
  WriteOffAdjustment,
} from "./types";

export type DirectAdjustment = ReceiveAdjustment | SellAdjustment | WriteOffAdjustment;

export function applyDirectAdjustment(
  txRepo: Repository,
  canonicalSku: string,
  input: DirectAdjustment,
  ctx: ExecutionContext,
): AdjustmentResult {
  const store = ctx.storeMap.get(input.storeId);
  if (!store) {
    throw new AppError("STORE_NOT_FOUND", 404, "Store not found");
  }
  const stock = txRepo.getStock(canonicalSku, input.storeId);
  if (!stock) {
    throw new AppError("NOT_STOCKED_AT_STORE", 422, "Product is not stocked at this store");
  }
  if ((input.type === "sell" || input.type === "write_off") && stock.onHand < input.quantity) {
    throw new AppError(
      "INSUFFICIENT_STOCK",
      409,
      `${store.name} only has ${stock.onHand} on hand. Enter ${stock.onHand} or less.`,
      [{ field: "quantity", code: "TOO_MANY", message: `Only ${stock.onHand} on hand.` }],
    );
  }

  const delta = input.type === "receive" ? input.quantity : -input.quantity;
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
    status: 201,
    body: { movements: adjustmentResult.movements, stock: adjustmentResult.stock },
  });

  return adjustmentResult;
}
