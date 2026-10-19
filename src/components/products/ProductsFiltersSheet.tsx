"use client";

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

export interface ProductsFiltersSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category?: string;
  status?: StockStatus;
  sort?: ProductSortKey;
  dir?: SortDirection;
  categories: { name: string }[];
  activeFiltersCount: number;
  onCategoryChange: (category?: string) => void;
  onStatusChange: (status?: StockStatus) => void;
  onSortChange?: (sort?: ProductSortKey, dir?: SortDirection) => void;
}

const SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: PRODUCT_SORT_KEY.UPDATED_AT, label: "Updated" },
  { value: PRODUCT_SORT_KEY.SKU, label: "SKU" },
  { value: PRODUCT_SORT_KEY.NAME, label: "Name" },
  { value: PRODUCT_SORT_KEY.CATEGORY, label: "Category" },
  { value: PRODUCT_SORT_KEY.ON_HAND, label: "On hand" },
  { value: PRODUCT_SORT_KEY.REORDER_LEVEL, label: "Reorder at" },
  { value: PRODUCT_SORT_KEY.STATUS, label: "Status" },
  { value: PRODUCT_SORT_KEY.UNIT_COST_SEN, label: "Unit cost" },
];

const SORT_LABEL_MAP: Record<ProductSortKey, string> = {
  [PRODUCT_SORT_KEY.UPDATED_AT]: "Updated",
  [PRODUCT_SORT_KEY.SKU]: "SKU",
  [PRODUCT_SORT_KEY.NAME]: "Name",
  [PRODUCT_SORT_KEY.CATEGORY]: "Category",
  [PRODUCT_SORT_KEY.ON_HAND]: "On hand",
  [PRODUCT_SORT_KEY.REORDER_LEVEL]: "Reorder at",
  [PRODUCT_SORT_KEY.STATUS]: "Status",
  [PRODUCT_SORT_KEY.UNIT_COST_SEN]: "Unit cost",
};

export function ProductsFiltersSheet({
  isOpen,
  onOpenChange,
  category,
  status,
  sort,
  dir,
  categories,
  activeFiltersCount,
  onCategoryChange,
  onStatusChange,
  onSortChange,
}: ProductsFiltersSheetProps): React.ReactElement {
  const statusOptions: { value: string; label: string }[] = [
    { value: ALL_OPTION, label: "All statuses" },
    { value: STOCK_STATUS.IN_STOCK, label: STOCK_STATUS_LABEL[STOCK_STATUS.IN_STOCK] },
    { value: STOCK_STATUS.LOW, label: STOCK_STATUS_LABEL[STOCK_STATUS.LOW] },
    { value: STOCK_STATUS.OUT, label: STOCK_STATUS_LABEL[STOCK_STATUS.OUT] },
  ];

  const handleCategoryChange = (val: string): void => {
    onCategoryChange(val === ALL_OPTION ? undefined : val);
  };

  const handleStatusChange = (val: string): void => {
    if (
      val === STOCK_STATUS.IN_STOCK ||
      val === STOCK_STATUS.LOW ||
      val === STOCK_STATUS.OUT
    ) {
      onStatusChange(val);
    } else {
      onStatusChange(undefined);
    }
  };

  const effectiveSort: ProductSortKey = sort ?? PRODUCT_SORT_KEY.UPDATED_AT;
  const effectiveDir: SortDirection = dir ?? SORT_DIRECTION.DESC;

  const handleSortChange = (val: string): void => {
    onSortChange?.(val as ProductSortKey, effectiveDir);
  };

  const handleToggleDir = (): void => {
    const nextDir: SortDirection =
      effectiveDir === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
    onSortChange?.(effectiveSort, nextDir);
  };

  const categoryLabel = category ?? "All categories";
  const statusLabel = status ? STOCK_STATUS_LABEL[status] : "All statuses";

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
            <span className="bg-accent-default text-caption flex size-5 items-center justify-center rounded-full font-medium text-white">
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
        <SheetHeader className="flex flex-row items-center justify-between p-0">
          <SheetTitle className="text-card text-text-primary">Filters</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1.5">
          <label className="text-label text-text-secondary font-medium">Category</label>
          <Select value={category ?? ALL_OPTION} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-11 w-full justify-between">
              <SelectValue placeholder="All categories">{categoryLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_OPTION}>All categories</SelectItem>
              {category && !categories.some((c) => c.name === category) && (
                <SelectItem value={category}>{category}</SelectItem>
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
          <label className="text-label text-text-secondary font-medium">Status</label>
          <Select value={status ?? ALL_OPTION} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-11 w-full justify-between">
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
          <label className="text-label text-text-secondary font-medium">Sort by</label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select value={effectiveSort} onValueChange={handleSortChange}>
                <SelectTrigger className="h-11 w-full justify-between">
                  <SelectValue placeholder="Sort by">{SORT_LABEL_MAP[effectiveSort]}</SelectValue>
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
              aria-label={`Sort ${effectiveDir === "asc" ? "ascending" : "descending"}`}
            >
              {effectiveDir === "asc" ? (
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
          onClick={() => onOpenChange(false)}
          className="bg-accent-default hover:bg-accent-default/90 text-label focus-visible:ring-border-focus mt-2 h-11 w-full cursor-pointer rounded-md font-medium text-white focus-visible:ring-2 focus-visible:outline-none"
        >
          Done
        </button>
      </SheetContent>
    </Sheet>
  );
}
