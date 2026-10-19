import {
  ADJUSTMENT_TYPE,
  STOCK_STATUS,
} from "@/constants";
import { getStatus, canRemoveStock } from "@/domain";
import type { Adjustment, StockStatus } from "@/types";

export type AdjustmentType = (typeof ADJUSTMENT_TYPE)[keyof typeof ADJUSTMENT_TYPE];

export interface AdjustStoreOption {
  storeId: string;
  storeName: string;
  onHand: number;
  reorderLevel: number;
}

export interface PreviewRow {
  storeId: string;
  storeName: string;
  beforeOnHand: number;
  afterOnHand: number | null;
  status: StockStatus | null;
  showBadge: boolean;
}

/**
 * Parses a string to a positive integer (whole number > 0).
 * Returns null for empty, non-integers, numbers <= 0, or invalid formats.
 */
export function parsePositiveInteger(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  if (!Number.isSafeInteger(num) || num <= 0) return null;
  return num;
}

const TYPE_BASE_LABELS: Record<AdjustmentType, string> = {
  [ADJUSTMENT_TYPE.RECEIVE]: "Receive",
  [ADJUSTMENT_TYPE.SELL]: "Sell",
  [ADJUSTMENT_TYPE.WRITE_OFF]: "Write off",
  [ADJUSTMENT_TYPE.TRANSFER]: "Transfer",
};

/**
 * Returns the submit button label based on type, quantity input, and saving state.
 * When quantity is a whole number >= 1, includes the quantity and unit/units.
 */
export function getSubmitButtonLabel(
  type: AdjustmentType,
  quantityInput: string,
  isSaving = false,
): string {
  if (isSaving) {
    return "Saving...";
  }

  const baseLabel = TYPE_BASE_LABELS[type] ?? "Adjust";
  const parsed = parsePositiveInteger(quantityInput);

  if (parsed !== null) {
    const unitWord = parsed === 1 ? "unit" : "units";
    return `${baseLabel} ${parsed} ${unitWord}`;
  }

  return baseLabel;
}

/**
 * Returns the over-stock error message formatted with store name and current stock.
 */
export function getOverStockErrorMessage(storeName: string, onHand: number): string {
  return `${storeName} only has ${onHand} on hand. Enter ${onHand} or less.`;
}

/**
 * Validates the reason field for Write-off (required, 3-200 chars).
 */
export function validateReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    return "Enter a reason (at least 3 characters).";
  }
  if (trimmed.length > 200) {
    return "Reason must be 200 characters or less.";
  }
  return null;
}

export interface CalculatePreviewParams {
  type: AdjustmentType;
  stores: AdjustStoreOption[];
  storeId?: string;
  fromStoreId?: string;
  toStoreId?: string;
  quantityStr: string;
}

/**
 * Computes preview rows for the affected stores.
 * Shows null afterOnHand (rendered as en dash) when quantity is invalid or exceeds stock.
 */
export function calculatePreviewRows(params: CalculatePreviewParams): PreviewRow[] {
  const { type, stores, storeId, fromStoreId, toStoreId, quantityStr } = params;
  const parsedQty = parsePositiveInteger(quantityStr);

  const getStore = (id?: string) => stores.find((s) => s.storeId === id);

  if (type === ADJUSTMENT_TYPE.TRANSFER) {
    const fromStore = getStore(fromStoreId);
    const toStore = getStore(toStoreId);
    const rows: PreviewRow[] = [];

    const isOverStock =
      parsedQty !== null && fromStore !== undefined && !canRemoveStock(fromStore.onHand, parsedQty);
    const isQtyValid = parsedQty !== null && !isOverStock;

    if (fromStore) {
      const afterOnHand = isQtyValid ? fromStore.onHand - parsedQty! : null;
      const status = afterOnHand !== null ? getStatus(afterOnHand, fromStore.reorderLevel) : null;
      rows.push({
        storeId: fromStore.storeId,
        storeName: fromStore.storeName,
        beforeOnHand: fromStore.onHand,
        afterOnHand,
        status,
        showBadge: status === STOCK_STATUS.LOW || status === STOCK_STATUS.OUT,
      });
    }

    if (toStore) {
      const afterOnHand = isQtyValid ? toStore.onHand + parsedQty! : null;
      const status = afterOnHand !== null ? getStatus(afterOnHand, toStore.reorderLevel) : null;
      rows.push({
        storeId: toStore.storeId,
        storeName: toStore.storeName,
        beforeOnHand: toStore.onHand,
        afterOnHand,
        status,
        showBadge: status === STOCK_STATUS.LOW || status === STOCK_STATUS.OUT,
      });
    }

    return rows;
  }

  // Receive, Sell, Write-off
  const selectedStore = getStore(storeId);
  if (!selectedStore) {
    return [];
  }

  const isRemoval = type === ADJUSTMENT_TYPE.SELL || type === ADJUSTMENT_TYPE.WRITE_OFF;
  const isOverStock =
    isRemoval && parsedQty !== null && !canRemoveStock(selectedStore.onHand, parsedQty);
  const isQtyValid = parsedQty !== null && !isOverStock;

  let afterOnHand: number | null = null;
  if (isQtyValid) {
    afterOnHand = isRemoval
      ? selectedStore.onHand - parsedQty!
      : selectedStore.onHand + parsedQty!;
  }

  const status = afterOnHand !== null ? getStatus(afterOnHand, selectedStore.reorderLevel) : null;

  return [
    {
      storeId: selectedStore.storeId,
      storeName: selectedStore.storeName,
      beforeOnHand: selectedStore.onHand,
      afterOnHand,
      status,
      showBadge: status === STOCK_STATUS.LOW || status === STOCK_STATUS.OUT,
    },
  ];
}

export interface AdjustmentToastInfo {
  title: string;
  description: string;
}

export type ToastStoreInput = {
  id?: string;
  storeId?: string;
  name?: string;
  storeName?: string;
};

/**
 * Builds the toast title and description for an adjustment.
 * Follows exact copy from docs/SCREENS.md.
 */
export function getAdjustmentToast(
  adjustment: Adjustment,
  stores: ToastStoreInput[],
): AdjustmentToastInfo {
  const getStoreName = (id: string) => {
    const found = stores.find(
      (s) => ("id" in s && s.id === id) || ("storeId" in s && s.storeId === id),
    );
    if (!found) return id;
    return ("name" in found && found.name) || ("storeName" in found && found.storeName) || id;
  };

  const unitText = adjustment.quantity === 1 ? "unit" : "units";

  switch (adjustment.type) {
    case ADJUSTMENT_TYPE.TRANSFER: {
      const fromName = getStoreName(adjustment.fromStoreId);
      const toName = getStoreName(adjustment.toStoreId);
      return {
        title: "Transfer saved",
        description: `${adjustment.quantity} ${unitText} moved from ${fromName} to ${toName}.`,
      };
    }
    case ADJUSTMENT_TYPE.RECEIVE: {
      const storeName = getStoreName(adjustment.storeId);
      return {
        title: "Stock received",
        description: `+${adjustment.quantity} ${unitText} at ${storeName}.`,
      };
    }
    case ADJUSTMENT_TYPE.SELL: {
      const storeName = getStoreName(adjustment.storeId);
      return {
        title: "Sale recorded",
        description: `\u2212${adjustment.quantity} ${unitText} at ${storeName}.`,
      };
    }
    case ADJUSTMENT_TYPE.WRITE_OFF: {
      const storeName = getStoreName(adjustment.storeId);
      return {
        title: "Write-off saved",
        description: `${adjustment.quantity} ${unitText} written off at ${storeName}.`,
      };
    }
  }
}

