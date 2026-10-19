import { ERROR_CODE, FIELD_ERROR_CODE, HTTP_STATUS, MOVEMENT_TYPE } from "@/constants";
import type { MovementDraft } from "@/types";
import { AppError } from "./errors";

/**
 * Check if a quantity is valid (whole number greater than zero).
 */
export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}

/**
 * Check if stock can be removed (onHand must be at least quantity).
 */
export function canRemoveStock(onHand: number, quantity: number): boolean {
  return onHand >= quantity;
}

export type PlanDirectAdjustmentInput = {
  productId: string;
  store: { storeId: string; storeName: string; onHand: number };
  type: "receive" | "sell" | "write_off";
  quantity: number;
  note?: string;
};

/**
 * Plans a direct stock adjustment (receive, sell, write-off) returning the movement draft.
 * Throws AppError if sell or write-off would take store below zero.
 */
export function planDirectAdjustment(input: PlanDirectAdjustmentInput): MovementDraft {
  const { productId, store, type, quantity, note } = input;

  if (
    (type === MOVEMENT_TYPE.SELL || type === MOVEMENT_TYPE.WRITE_OFF) &&
    !canRemoveStock(store.onHand, quantity)
  ) {
    throw new AppError(
      ERROR_CODE.INSUFFICIENT_STOCK,
      HTTP_STATUS.CONFLICT,
      `${store.storeName} only has ${store.onHand} on hand. Enter ${store.onHand} or less.`,
      [
        {
          field: "quantity",
          code: FIELD_ERROR_CODE.TOO_MANY,
          message: `Only ${store.onHand} on hand.`,
        },
      ],
    );
  }

  const delta = type === MOVEMENT_TYPE.RECEIVE ? quantity : -quantity;
  const balanceAfter = store.onHand + delta;

  return {
    productId,
    storeId: store.storeId,
    type,
    quantity: delta,
    balanceAfter,
    ...(note ? { note } : {}),
  };
}

export type PlanTransferInput = {
  productId: string;
  from: { storeId: string; storeName: string; onHand: number };
  to: { storeId: string; storeName: string; onHand: number };
  quantity: number;
  transferId?: string;
  note?: string;
};

/**
 * Plans a transfer between two stores returning the outgoing and incoming movement drafts.
 * Throws AppError if transfer would take source below zero or if destination is the same store.
 */
export function planTransfer(input: PlanTransferInput): { out: MovementDraft; in: MovementDraft } {
  const { productId, from, to, quantity, transferId, note } = input;

  if (from.storeId === to.storeId) {
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

  if (!canRemoveStock(from.onHand, quantity)) {
    throw new AppError(
      ERROR_CODE.INSUFFICIENT_STOCK,
      HTTP_STATUS.CONFLICT,
      `${from.storeName} only has ${from.onHand} on hand. Enter ${from.onHand} or less.`,
      [
        {
          field: "quantity",
          code: FIELD_ERROR_CODE.TOO_MANY,
          message: `Only ${from.onHand} on hand.`,
        },
      ],
    );
  }

  const out: MovementDraft = {
    productId,
    storeId: from.storeId,
    type: MOVEMENT_TYPE.TRANSFER_OUT,
    quantity: -quantity,
    balanceAfter: from.onHand - quantity,
    ...(transferId ? { transferId } : {}),
    ...(note ? { note } : {}),
  };

  const inMovement: MovementDraft = {
    productId,
    storeId: to.storeId,
    type: MOVEMENT_TYPE.TRANSFER_IN,
    quantity,
    balanceAfter: to.onHand + quantity,
    ...(transferId ? { transferId } : {}),
    ...(note ? { note } : {}),
  };

  return { out, in: inMovement };
}
