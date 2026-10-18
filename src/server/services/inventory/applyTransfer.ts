import "server-only";

import { ERROR_CODE, HTTP_STATUS } from "@/constants";
import { AppError, planTransfer } from "@/domain";
import type { Repository, UserRecord } from "@/server/repositories";
import { toMovementDto } from "@/server/services/movementDto";
import type { AdjustmentResult, TransferAdjustment } from "@/types";
import { recordResult } from "./idempotency";
import type { AdjustmentContext } from "./types";

/**
 * Applies a stock transfer between two stores within a repository transaction.
 */
export function applyTransfer(
  txRepo: Repository,
  canonicalSku: string,
  input: TransferAdjustment,
  ctx: AdjustmentContext,
  nowIso: string,
  userMap: Map<string, UserRecord>,
): AdjustmentResult {
  const stores = txRepo.getStores();
  const fromStore = stores.find((s) => s.id === input.fromStoreId);
  const toStore = stores.find((s) => s.id === input.toStoreId);
  if (!fromStore || !toStore) {
    throw new AppError(ERROR_CODE.STORE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Store not found");
  }

  const fromStock = txRepo.getStock(canonicalSku, input.fromStoreId);
  const toStock = txRepo.getStock(canonicalSku, input.toStoreId);
  if (!fromStock || !toStock) {
    throw new AppError(
      ERROR_CODE.NOT_STOCKED_AT_STORE,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "Product is not stocked at this store",
    );
  }

  const transferId = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const transferNote = input.note ?? "Stock transfer";

  const { out, in: inDraft } = planTransfer({
    productId: canonicalSku,
    from: { storeId: fromStore.id, storeName: fromStore.name, onHand: fromStock.onHand },
    to: { storeId: toStore.id, storeName: toStore.name, onHand: toStock.onHand },
    quantity: input.quantity,
    transferId,
    note: transferNote,
  });

  txRepo.setStock(canonicalSku, input.fromStoreId, out.balanceAfter, fromStock.reorderLevel);
  txRepo.setStock(canonicalSku, input.toStoreId, inDraft.balanceAfter, toStock.reorderLevel);

  const outRecord = txRepo.addMovement({
    productId: canonicalSku,
    storeId: input.fromStoreId,
    type: out.type,
    quantity: out.quantity,
    balanceAfter: out.balanceAfter,
    reason: transferNote,
    transferId,
    createdAt: nowIso,
    userId: ctx.user.id,
  });

  const inRecord = txRepo.addMovement({
    productId: canonicalSku,
    storeId: input.toStoreId,
    type: inDraft.type,
    quantity: inDraft.quantity,
    balanceAfter: inDraft.balanceAfter,
    reason: transferNote,
    transferId,
    createdAt: nowIso,
    userId: ctx.user.id,
  });

  const counterpartMap = new Map<string, string>([
    [outRecord.id, inRecord.storeId],
    [inRecord.id, outRecord.storeId],
  ]);

  const result: AdjustmentResult = {
    replay: false,
    movements: [
      toMovementDto(outRecord, userMap, counterpartMap),
      toMovementDto(inRecord, userMap, counterpartMap),
    ],
    stock: [
      { storeId: input.fromStoreId, onHand: out.balanceAfter },
      { storeId: input.toStoreId, onHand: inDraft.balanceAfter },
    ],
  };

  recordResult(txRepo, ctx, result);

  return result;
}
