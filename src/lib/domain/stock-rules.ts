import { AppError } from "./errors";

export type MovementType =
  "receive" | "sell" | "write_off" | "transfer_out" | "transfer_in" | "import";

export type MovementDraft = {
  productId: string;
  storeId: string;
  type: MovementType;
  quantity: number;
  balanceAfter: number;
  note?: string;
  transferId?: string;
};

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

/**
 * Plan a transfer between two stores.
 * Throws AppError if transfer would take source below zero or if stores are the same.
 */
export function planTransfer(input: {
  productId: string;
  from: { storeId: string; onHand: number };
  to: { storeId: string; onHand: number };
  quantity: number;
  transferId: string;
}): { out: MovementDraft; in: MovementDraft } {
  const { productId, from, to, quantity, transferId } = input;

  if (from.storeId === to.storeId) {
    throw new AppError(
      "VALIDATION_ERROR",
      422,
      "VALIDATION_ERROR: Cannot transfer to the same store",
      [
        {
          field: "to",
          code: "SAME_STORE",
          message: "Source and destination stores must be different",
        },
      ],
    );
  }

  if (!canRemoveStock(from.onHand, quantity)) {
    throw new AppError(
      "INSUFFICIENT_STOCK",
      409,
      `INSUFFICIENT_STOCK: Cannot transfer ${quantity}. Only ${from.onHand} on hand at ${from.storeId}.`,
    );
  }

  const out: MovementDraft = {
    productId,
    storeId: from.storeId,
    type: "transfer_out",
    quantity: -quantity,
    balanceAfter: from.onHand - quantity,
    transferId,
  };

  const inMovement: MovementDraft = {
    productId,
    storeId: to.storeId,
    type: "transfer_in",
    quantity,
    balanceAfter: to.onHand + quantity,
    transferId,
  };

  return { out, in: inMovement };
}
