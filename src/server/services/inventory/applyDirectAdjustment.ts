import "server-only";

import { ERROR_CODE, HTTP_STATUS } from "@/constants";
import { AppError, planDirectAdjustment } from "@/domain";
import type { Repository, UserRecord } from "@/server/repositories";
import { toMovementDto } from "@/server/services/movementDto";
import type {
  AdjustmentResult,
  ReceiveAdjustment,
  SellAdjustment,
  WriteOffAdjustment,
} from "@/types";
import { recordResult } from "./idempotency";
import type { AdjustmentContext } from "./types";

export type DirectAdjustment = ReceiveAdjustment | SellAdjustment | WriteOffAdjustment;

/**
 * Applies a direct adjustment (receive, sell, or write-off) within a repository transaction.
 */
export function applyDirectAdjustment(
  txRepo: Repository,
  canonicalSku: string,
  input: DirectAdjustment,
  ctx: AdjustmentContext,
  nowIso: string,
  userMap: Map<string, UserRecord>,
): AdjustmentResult {
  const store = txRepo.getStores().find((s) => s.id === input.storeId);
  if (!store) {
    throw new AppError(ERROR_CODE.STORE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Store not found");
  }
  const stock = txRepo.getStock(canonicalSku, input.storeId);
  if (!stock) {
    throw new AppError(
      ERROR_CODE.NOT_STOCKED_AT_STORE,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Product is not stocked at this store",
    );
  }

  const draft = planDirectAdjustment({
    productId: canonicalSku,
    store: { storeId: store.id, storeName: store.name, onHand: stock.onHand },
    type: input.type,
    quantity: input.quantity,
    note: input.note,
  });

  txRepo.setStock(canonicalSku, input.storeId, draft.balanceAfter, stock.reorderLevel);

  const savedMovement = txRepo.addMovement({
    productId: canonicalSku,
    storeId: input.storeId,
    type: input.type,
    quantity: draft.quantity,
    balanceAfter: draft.balanceAfter,
    reason: input.note ?? null,
    transferId: null,
    createdAt: nowIso,
    userId: ctx.user.id,
  });

  const movementDto = toMovementDto(savedMovement, userMap);

  const result: AdjustmentResult = {
    replay: false,
    movements: [movementDto],
    stock: [{ storeId: input.storeId, onHand: draft.balanceAfter }],
  };

  recordResult(txRepo, ctx, result);

  return result;
}
