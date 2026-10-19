"use client";

import { useMemo, useRef, useEffect, type ReactElement } from "react";
import { CloseIcon, TransferIcon } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ADJUSTMENT_TYPE, ROLE_LABEL } from "@/constants";
import {
  calculatePreviewRows,
  getSubmitButtonLabel,
  type AdjustStoreOption,
} from "@/helpers";
import { useAdjustForm } from "@/hooks";
import type { Adjustment, Role } from "@/types";
import { AdjustTypeSelector } from "./AdjustTypeSelector";
import { StoreSelect } from "./StoreSelect";
import { QuantityField } from "./QuantityField";
import { NoteField } from "./NoteField";
import { AdjustPreview } from "./AdjustPreview";

export interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; sku: string; name: string };
  stores: AdjustStoreOption[];
  initialStoreId?: string;
  user: { name: string; role: Role };
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (payload: Adjustment) => void;
}

export function AdjustStockDialog({
  open,
  onOpenChange,
  product,
  stores,
  initialStoreId,
  user,
  isSaving,
  serverError,
  onSubmit,
}: AdjustStockDialogProps): ReactElement {
  const openerRef = useRef<HTMLElement | null>(null);
  const selectedTypeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) openerRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  const form = useAdjustForm({ stores, initialStoreId, isOpen: open, onSubmit });

  const toStoreOptions = useMemo(
    () => stores.filter((s) => s.storeId !== form.fromStoreId),
    [stores, form.fromStoreId],
  );

  const previewRows = useMemo(
    () =>
      calculatePreviewRows({
        type: form.type,
        stores,
        storeId: form.storeId,
        fromStoreId: form.fromStoreId,
        toStoreId: form.toStoreId,
        quantityStr: form.quantity,
      }),
    [form.type, stores, form.storeId, form.fromStoreId, form.toStoreId, form.quantity],
  );

  const submitLabel = getSubmitButtonLabel(form.type, form.quantity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => { e.preventDefault(); selectedTypeRef.current?.focus(); }}
        onCloseAutoFocus={(e) => { if (openerRef.current) { e.preventDefault(); openerRef.current.focus(); } }}
        onEscapeKeyDown={(e) => { if (isSaving) e.preventDefault(); }}
        onPointerDownOutside={(e) => { if (isSaving) e.preventDefault(); }}
        onInteractOutside={(e) => { if (isSaving) e.preventDefault(); }}
      >
        <DialogHeader className="relative px-2xl pt-xl">
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription className="mt-xs flex items-center gap-sm">
            <span className="flex h-5 items-center rounded-sm bg-bg-muted px-sm text-mono text-text-secondary">
              {product.sku}
            </span>
            <span className="truncate text-body-small text-text-secondary">{product.name}</span>
          </DialogDescription>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            aria-label="Close"
            className="absolute top-md right-lg flex size-8 cursor-pointer items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-subtle disabled:pointer-events-none disabled:opacity-50"
          >
            <CloseIcon className="size-4" />
          </button>
        </DialogHeader>

        <form onSubmit={form.handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-xl overflow-y-auto px-2xl pt-2xl pb-2xl">
            <AdjustTypeSelector
              type={form.type}
              role={user.role}
              disabled={isSaving}
              onTypeChange={form.setType}
              selectedRef={selectedTypeRef}
            />

            {form.type !== ADJUSTMENT_TYPE.TRANSFER ? (
              <StoreSelect
                id="adjust-store"
                label="Store"
                value={form.storeId ?? ""}
                stores={stores}
                disabled={isSaving}
                error={form.errors.store}
                touched={form.touched.store}
                onChange={form.setStoreId}
                onBlur={() => form.markTouched("store")}
              />
            ) : (
              <div className="grid grid-cols-1 items-end gap-x-[10px] gap-y-sm sm:grid-cols-[1fr_24px_1fr] sm:gap-y-0">
                <StoreSelect
                  id="adjust-from-store"
                  label="From"
                  value={form.fromStoreId ?? ""}
                  stores={stores}
                  disabled={isSaving}
                  error={form.errors.from}
                  touched={form.touched.from}
                  onChange={form.setFromStoreId}
                  onBlur={() => form.markTouched("from")}
                />
                <button
                  type="button"
                  aria-label="Swap stores"
                  disabled={isSaving}
                  onClick={form.swapStores}
                  className="my-1 flex size-6 cursor-pointer items-center justify-center justify-self-center rounded-md text-text-tertiary transition-colors hover:bg-bg-subtle disabled:pointer-events-none disabled:opacity-50 sm:my-0 sm:mb-2 sm:rotate-0 sm:justify-self-auto rotate-90"
                >
                  <TransferIcon className="size-4" />
                </button>
                <StoreSelect
                  id="adjust-to-store"
                  label="To"
                  value={form.toStoreId ?? ""}
                  stores={toStoreOptions}
                  disabled={isSaving}
                  error={form.errors.to}
                  touched={form.touched.to}
                  onChange={form.setToStoreId}
                  onBlur={() => form.markTouched("to")}
                />
              </div>
            )}

            <QuantityField
              value={form.quantity}
              error={form.errors.quantity}
              touched={form.touched.quantity}
              disabled={isSaving}
              onChange={form.setQuantity}
              onBlur={() => form.markTouched("quantity")}
            />

            {form.type !== ADJUSTMENT_TYPE.SELL && (
              <NoteField
                type={form.type}
                value={form.note}
                error={form.errors.note}
                touched={form.touched.note}
                disabled={isSaving}
                onChange={form.setNote}
                onBlur={() => form.markTouched("note")}
              />
            )}

            <AdjustPreview rows={previewRows} />

            {serverError && (
              <div
                role="alert"
                className="rounded-md border border-status-danger-border bg-status-danger-bg px-md py-sm text-body-small text-status-danger-fg"
              >
                {serverError}
              </div>
            )}
          </div>

          <DialogFooter className="flex shrink-0 flex-col items-start justify-between gap-md border-t border-border-default px-2xl py-[15px] sm:flex-row sm:items-center">
            <span className="text-caption text-text-tertiary">
              Signed in as {user.name} ({ROLE_LABEL[user.role]})
            </span>
            <div className="flex w-full items-center justify-end gap-sm sm:w-auto">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="h-10 cursor-pointer rounded-md border border-border-default bg-bg-surface px-lg text-label text-text-primary transition-colors hover:bg-bg-subtle disabled:pointer-events-none disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!form.isValid || isSaving}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-xs rounded-md bg-accent-default px-xl text-label text-text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-accent-disabled"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  submitLabel
                )}
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
