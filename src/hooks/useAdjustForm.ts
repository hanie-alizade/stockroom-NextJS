"use client";

import { useState, useCallback, useMemo } from "react";
import { ADJUSTMENT_TYPE } from "@/constants";
import {
  parsePositiveInteger,
  getOverStockErrorMessage,
  validateReason,
  type AdjustmentType,
  type AdjustStoreOption,
} from "@/helpers";
import { canRemoveStock } from "@/domain";
import { adjustmentSchema } from "@/schemas";
import type { Adjustment } from "@/types";

export interface UseAdjustFormOptions {
  stores: AdjustStoreOption[];
  initialStoreId?: string;
  isOpen: boolean;
  onSubmit: (payload: Adjustment) => void;
}

export interface AdjustFormErrors {
  store?: string;
  from?: string;
  to?: string;
  quantity?: string;
  note?: string;
}

export function useAdjustForm({
  stores,
  initialStoreId,
  isOpen,
  onSubmit,
}: UseAdjustFormOptions) {
  const [type, setTypeState] = useState<AdjustmentType>(ADJUSTMENT_TYPE.RECEIVE);
  const [storeId, setStoreIdState] = useState<string | undefined>(initialStoreId);
  const [fromStoreId, setFromStoreIdState] = useState<string | undefined>(initialStoreId);
  const [toStoreId, setToStoreIdState] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialStoreId, setPrevInitialStoreId] = useState(initialStoreId);

  // Reset form when dialog opens
  if (isOpen !== prevIsOpen || (isOpen && initialStoreId !== prevInitialStoreId)) {
    setPrevIsOpen(isOpen);
    setPrevInitialStoreId(initialStoreId);
    if (isOpen) {
      setTypeState(ADJUSTMENT_TYPE.RECEIVE);
      setStoreIdState(initialStoreId);
      setFromStoreIdState(initialStoreId);
      setToStoreIdState(undefined);
      setQuantity("");
      setNote("");
      setTouched({});
    }
  }

  const setType = useCallback(
    (newType: AdjustmentType) => {
      setTypeState((prevType) => {
        if (newType === prevType) return prevType;
        if (newType === ADJUSTMENT_TYPE.TRANSFER) {
          if (storeId) {
            setFromStoreIdState(storeId);
            setToStoreIdState((prevTo) => (prevTo === storeId ? undefined : prevTo));
          }
        } else if (prevType === ADJUSTMENT_TYPE.TRANSFER) {
          if (fromStoreId) {
            setStoreIdState(fromStoreId);
          }
        }
        return newType;
      });
    },
    [storeId, fromStoreId],
  );

  const setStoreId = useCallback((id: string) => {
    setStoreIdState(id);
  }, []);

  const setFromStoreId = useCallback((id: string) => {
    setFromStoreIdState(id);
    setToStoreIdState((prevTo) => (prevTo === id ? undefined : prevTo));
  }, []);

  const setToStoreId = useCallback((id: string) => {
    setToStoreIdState(id);
  }, []);

  const swapStores = useCallback(() => {
    setFromStoreIdState(toStoreId);
    setToStoreIdState(fromStoreId);
  }, [fromStoreId, toStoreId]);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const markAllTouched = useCallback(() => {
    setTouched({
      store: true,
      from: true,
      to: true,
      quantity: true,
      note: true,
    });
  }, []);

  // Validation calculations
  const errors: AdjustFormErrors = useMemo(() => {
    const errs: AdjustFormErrors = {};
    const parsedQty = parsePositiveInteger(quantity);

    // Quantity error
    if (!quantity.trim() || parsedQty === null) {
      errs.quantity = "Enter a whole number above 0.";
    } else {
      if (type === ADJUSTMENT_TYPE.SELL || type === ADJUSTMENT_TYPE.WRITE_OFF) {
        const store = stores.find((s) => s.storeId === storeId);
        if (store && !canRemoveStock(store.onHand, parsedQty)) {
          errs.quantity = getOverStockErrorMessage(store.storeName, store.onHand);
        }
      } else if (type === ADJUSTMENT_TYPE.TRANSFER) {
        const fromStore = stores.find((s) => s.storeId === fromStoreId);
        if (fromStore && !canRemoveStock(fromStore.onHand, parsedQty)) {
          errs.quantity = getOverStockErrorMessage(fromStore.storeName, fromStore.onHand);
        }
      }
    }

    // Store error
    if (type === ADJUSTMENT_TYPE.TRANSFER) {
      if (!fromStoreId) {
        errs.from = "Choose a store.";
      }
      if (!toStoreId) {
        errs.to = "Choose a store.";
      }
    } else {
      if (!storeId) {
        errs.store = "Choose a store.";
      }
    }

    // Note / Reason error
    if (type === ADJUSTMENT_TYPE.WRITE_OFF) {
      const reasonErr = validateReason(note);
      if (reasonErr) {
        errs.note = reasonErr;
      }
    } else if (note.length > 200) {
      errs.note = "Note must be 200 characters or less.";
    }

    return errs;
  }, [type, storeId, fromStoreId, toStoreId, quantity, note, stores]);

  const payload: Adjustment | null = useMemo(() => {
    const parsedQty = parsePositiveInteger(quantity);
    if (parsedQty === null) return null;

    if (type === ADJUSTMENT_TYPE.RECEIVE && storeId) {
      return {
        type: ADJUSTMENT_TYPE.RECEIVE,
        storeId,
        quantity: parsedQty,
        ...(note.trim() ? { note: note.trim() } : {}),
      };
    }

    if (type === ADJUSTMENT_TYPE.SELL && storeId) {
      return {
        type: ADJUSTMENT_TYPE.SELL,
        storeId,
        quantity: parsedQty,
        ...(note.trim() ? { note: note.trim() } : {}),
      };
    }

    if (type === ADJUSTMENT_TYPE.WRITE_OFF && storeId) {
      const trimmedNote = note.trim();
      if (trimmedNote.length >= 3 && trimmedNote.length <= 200) {
        return {
          type: ADJUSTMENT_TYPE.WRITE_OFF,
          storeId,
          quantity: parsedQty,
          note: trimmedNote,
        };
      }
    }

    if (type === ADJUSTMENT_TYPE.TRANSFER && fromStoreId && toStoreId && fromStoreId !== toStoreId) {
      return {
        type: ADJUSTMENT_TYPE.TRANSFER,
        fromStoreId,
        toStoreId,
        quantity: parsedQty,
        ...(note.trim() ? { note: note.trim() } : {}),
      };
    }

    return null;
  }, [type, storeId, fromStoreId, toStoreId, quantity, note]);

  const isValid = useMemo(() => {
    if (Object.keys(errors).length > 0 || !payload) return false;
    const zodResult = adjustmentSchema.safeParse(payload);
    return zodResult.success;
  }, [errors, payload]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (isValid && payload) {
        onSubmit(payload);
      } else {
        markAllTouched();
      }
    },
    [isValid, payload, onSubmit, markAllTouched],
  );

  return {
    type,
    setType,
    storeId,
    setStoreId,
    fromStoreId,
    setFromStoreId,
    toStoreId,
    setToStoreId,
    swapStores,
    quantity,
    setQuantity,
    note,
    setNote,
    touched,
    markTouched,
    markAllTouched,
    errors,
    isValid,
    handleSubmit,
  };
}
