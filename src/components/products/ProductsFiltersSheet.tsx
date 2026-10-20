"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { StockStatus, ProductSortKey, SortDirection } from "@/types";
import {
  ALL_OPTION,
  PRODUCT_SORT_KEY,
  SORT_DIRECTION,
  STOCK_STATUS,
  STOCK_STATUS_LABEL,
} from "@/constants";

export type ProductsFiltersDraft = {
  category?: string;
  status?: StockStatus;
  sort?: ProductSortKey;
  dir?: SortDirection;
};

export interface ProductsFiltersSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category?: string;
  status?: StockStatus;
  sort?: ProductSortKey;
  dir?: SortDirection;
  categories: { name: string }[];
  activeFiltersCount: number;
  onApply: (draft: ProductsFiltersDraft) => void;
}

export interface FiltersFormProps {
  category?: string;
  status?: StockStatus;
  sort?: ProductSortKey;
  dir?: SortDirection;
  categories: { name: string }[];
  onApply: (draft: ProductsFiltersDraft) => void;
  onClose: () => void;
}

export const SORT_OPTIONS = [
  { value: PRODUCT_SORT_KEY.UPDATED_AT, label: "Updated" },
  { value: PRODUCT_SORT_KEY.SKU, label: "SKU" },
  { value: PRODUCT_SORT_KEY.NAME, label: "Name" },
  { value: PRODUCT_SORT_KEY.CATEGORY, label: "Category" },
  { value: PRODUCT_SORT_KEY.ON_HAND, label: "On hand" },
  { value: PRODUCT_SORT_KEY.REORDER_LEVEL, label: "Reorder at" },
  { value: PRODUCT_SORT_KEY.STATUS, label: "Status" },
  { value: PRODUCT_SORT_KEY.UNIT_COST_SEN, label: "Unit cost" },
] as const;

export function isProductSortKey(value: string): value is ProductSortKey {
  return SORT_OPTIONS.some((opt) => opt.value === value);
}

export const SORT_LABEL_MAP: Record<ProductSortKey, string> = Object.fromEntries(
  SORT_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<ProductSortKey, string>;

export function FiltersForm({
  category,
  status,
  sort,
  dir,
  categories,
  onApply,
  onClose,
}: FiltersFormProps): React.ReactElement {
  const [draftCategory, setDraftCategory] = useState<string | undefined>(category);
  const [draftStatus, setDraftStatus] = useState<StockStatus | undefined>(status);
  const [draftSort, setDraftSort] = useState<ProductSortKey>(sort ?? PRODUCT_SORT_KEY.UPDATED_AT);
  const [draftDir, setDraftDir] = useState<SortDirection>(dir ?? SORT_DIRECTION.DESC);

  const statusOptions: { value: string; label: string }[] = [
    { value: ALL_OPTION, label: "All statuses" },
    { value: STOCK_STATUS.IN_STOCK, label: STOCK_STATUS_LABEL[STOCK_STATUS.IN_STOCK] },
    { value: STOCK_STATUS.LOW, label: STOCK_STATUS_LABEL[STOCK_STATUS.LOW] },
    { value: STOCK_STATUS.OUT, label: STOCK_STATUS_LABEL[STOCK_STATUS.OUT] },
  ];

  const handleCategoryChange = (val: string): void => {
    setDraftCategory(val === ALL_OPTION ? undefined : val);
  };

  const handleStatusChange = (val: string): void => {
    if (
      val === STOCK_STATUS.IN_STOCK ||
      val === STOCK_STATUS.LOW ||
      val === STOCK_STATUS.OUT
    ) {
      setDraftStatus(val);
    } else {
      setDraftStatus(undefined);
    }
  };

  const handleSortChange = (val: string): void => {
    if (isProductSortKey(val)) {
      setDraftSort(val);
    }
  };

  const handleToggleDir = (): void => {
    setDraftDir((prev) =>
      prev === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC,
    );
  };

  const handleReset = (): void => {
    setDraftCategory(undefined);
    setDraftStatus(undefined);
    setDraftSort(PRODUCT_SORT_KEY.UPDATED_AT);
    setDraftDir(SORT_DIRECTION.DESC);
  };

  const handleDone = (): void => {
    onApply({
      category: draftCategory,
      status: draftStatus,
      sort: draftSort,
      dir: draftDir,
    });
    onClose();
  };

  const categoryLabel = draftCategory ?? "All categories";
  const statusLabel = draftStatus ? STOCK_STATUS_LABEL[draftStatus] : "All statuses";

  return (
    <>
      <SheetHeader className="flex flex-row items-center justify-between p-0">
        <SheetTitle className="text-card text-text-primary">Filters</SheetTitle>
        <button
          type="button"
          onClick={handleReset}
          className="text-label text-text-secondary hover:text-text-primary focus-visible:ring-border-focus cursor-pointer font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          Reset
        </button>
      </SheetHeader>

      <div className="flex flex-col gap-1.5">
        <label
          id="filters-category-label"
          htmlFor="filters-category-select"
          className="text-label text-text-secondary font-medium"
        >
          Category
        </label>
        <Select value={draftCategory ?? ALL_OPTION} onValueChange={handleCategoryChange}>
          <SelectTrigger
            id="filters-category-select"
            aria-labelledby="filters-category-label"
            className="h-11 w-full justify-between"
          >
            <SelectValue placeholder="All categories">{categoryLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>All categories</SelectItem>
            {draftCategory && !categories.some((c) => c.name === draftCategory) && (
              <SelectItem value={draftCategory}>{draftCategory}</SelectItem>
            )}
            {categories.map((cat) => (
              <SelectItem key={cat.name} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          id="filters-status-label"
          htmlFor="filters-status-select"
          className="text-label text-text-secondary font-medium"
        >
          Status
        </label>
        <Select value={draftStatus ?? ALL_OPTION} onValueChange={handleStatusChange}>
          <SelectTrigger
            id="filters-status-select"
            aria-labelledby="filters-status-label"
            className="h-11 w-full justify-between"
          >
            <SelectValue placeholder="All statuses">{statusLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          id="filters-sort-label"
          htmlFor="filters-sort-select"
          className="text-label text-text-secondary font-medium"
        >
          Sort by
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select value={draftSort} onValueChange={handleSortChange}>
              <SelectTrigger
                id="filters-sort-select"
                aria-labelledby="filters-sort-label"
                className="h-11 w-full justify-between"
              >
                <SelectValue placeholder="Sort by">{SORT_LABEL_MAP[draftSort]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={handleToggleDir}
            className="border-border-default bg-bg-surface hover:bg-bg-subtle text-text-primary text-label focus-visible:ring-border-focus flex h-11 min-w-[44px] shrink-0 cursor-pointer select-none items-center justify-center gap-1 rounded-md border px-3 focus-visible:ring-2 focus-visible:outline-none"
            aria-label={`Sort ${draftDir === "asc" ? "ascending" : "descending"}`}
          >
            {draftDir === "asc" ? (
              <>
                <ArrowUpIcon className="size-4" />
                <span className="text-label font-medium">Asc</span>
              </>
            ) : (
              <>
                <ArrowDownIcon className="size-4" />
                <span className="text-label font-medium">Desc</span>
              </>
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDone}
        className="bg-accent-default hover:bg-accent-hover text-text-on-accent text-label focus-visible:ring-border-focus mt-2 h-11 w-full cursor-pointer rounded-md font-medium focus-visible:ring-2 focus-visible:outline-none"
      >
        Done
      </button>
    </>
  );
}

export function ProductsFiltersSheet({
  isOpen,
  onOpenChange,
  category,
  status,
  sort,
  dir,
  categories,
  activeFiltersCount,
  onApply,
}: ProductsFiltersSheetProps): React.ReactElement {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="border-border-default bg-bg-surface hover:bg-bg-subtle text-text-primary text-label focus-visible:ring-border-focus flex h-11 shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-md border px-3 focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Filters"
        >
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-accent-default text-caption text-text-on-accent flex size-5 items-center justify-center rounded-full font-medium">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="bg-bg-surface border-border-default flex max-h-[85vh] flex-col gap-5 overflow-y-auto rounded-t-2xl border-t p-6"
      >
        {isOpen && (
          <FiltersForm
            category={category}
            status={status}
            sort={sort}
            dir={dir}
            categories={categories}
            onApply={onApply}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
