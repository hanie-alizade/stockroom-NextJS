"use client";

import { ALL_STORES, STOCK_STATUS_LABEL } from "@/constants";
import { CloseIcon } from "@/components/icons";
import type { StockStatus, StoreScope } from "@/types";

export interface ProductsChipsProps {
  store?: StoreScope;
  storeName?: string;
  search?: string;
  category?: string;
  status?: StockStatus;
  onRemoveStore: () => void;
  onRemoveSearch: () => void;
  onRemoveCategory: () => void;
  onRemoveStatus: () => void;
  onClearAll: () => void;
}

export function ProductsChips({
  store,
  storeName,
  search,
  category,
  status,
  onRemoveStore,
  onRemoveSearch,
  onRemoveCategory,
  onRemoveStatus,
  onClearAll,
}: ProductsChipsProps): React.ReactElement | null {
  const chips: { key: string; label: string; ariaLabel: string; onRemove: () => void }[] = [];

  if (store && store !== ALL_STORES) {
    chips.push({
      key: "store",
      label: `Store: ${storeName ?? store}`,
      ariaLabel: "Remove store filter",
      onRemove: onRemoveStore,
    });
  }

  if (search && search.trim()) {
    chips.push({
      key: "search",
      label: `Search: ${search.trim()}`,
      ariaLabel: "Remove search filter",
      onRemove: onRemoveSearch,
    });
  }

  if (category && category !== ALL_STORES) {
    chips.push({
      key: "category",
      label: `Category: ${category}`,
      ariaLabel: "Remove category filter",
      onRemove: onRemoveCategory,
    });
  }

  if (status) {
    chips.push({
      key: "status",
      label: `Status: ${STOCK_STATUS_LABEL[status]}`,
      ariaLabel: "Remove status filter",
      onRemove: onRemoveStatus,
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="border-border-default flex h-[52px] items-center border-t px-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-5">
          {chips.map((chip) => (
            <div
              key={chip.key}
              className="max-w-32 overflow-hidden text-ellipsis whitespace-nowrap border-border-default bg-bg-surface text-label text-text-primary inline-flex h-[30px] items-center gap-1.5 rounded-full border py-1 pr-1.5 pl-3 select-none"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                aria-label={chip.ariaLabel}
                onClick={chip.onRemove}
                className="text-text-tertiary hover:text-text-primary inline-flex size-4 cursor-pointer items-center justify-center rounded-full transition-colors"
              >
                <CloseIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-text-link text-label cursor-pointer whitespace-nowrap hover:underline"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
