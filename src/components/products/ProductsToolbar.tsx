"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_OPTION, DEFAULT_PAGE, SORT_DIRECTION, STOCK_STATUS, STOCK_STATUS_LABEL } from "@/constants";
import { buildProductListUrl, parseProductListParams } from "@/helpers";
import { useDebouncedCallback } from "@/lib/client/useDebouncedCallback";
import type { StockStatus, ProductSortKey, SortDirection, ProductListQuery } from "@/types";
import { ProductsFiltersSheet, type ProductsFiltersDraft } from "./ProductsFiltersSheet";

export interface ProductsToolbarProps {
  search?: string;
  category?: string;
  status?: StockStatus;
  categories: { name: string }[];
  totalResults: number;
  onSearchChange: (q: string) => void;
  onCategoryChange: (category?: string) => void;
  onStatusChange: (status?: StockStatus) => void;
  sort?: ProductSortKey;
  dir?: SortDirection;
  onSortChange?: (sort?: ProductSortKey, dir?: SortDirection) => void;
}

export function ProductsToolbar({
  search = "",
  category,
  status,
  categories,
  totalResults,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  sort,
  dir,
  onSortChange,
}: ProductsToolbarProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const debouncedSearch = useDebouncedCallback(onSearchChange, 500);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const desktopInput = desktopInputRef.current;
    if (desktopInput && document.activeElement !== desktopInput && desktopInput.value !== search) {
      desktopInput.value = search;
    }
    const mobileInput = mobileInputRef.current;
    if (mobileInput && document.activeElement !== mobileInput && mobileInput.value !== search) {
      mobileInput.value = search;
    }
  }, [search]);

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

  const handleApplyFilters = (draft: ProductsFiltersDraft): void => {
    const current = parseProductListParams(searchParams);
    const next: ProductListQuery = {
      ...current,
      category: draft.category,
      status: draft.status,
      sort: draft.sort,
      dir: draft.sort ? (draft.dir ?? SORT_DIRECTION.DESC) : undefined,
      page: DEFAULT_PAGE,
    };
    router.push(buildProductListUrl(pathname, next));
  };

  const categoryLabel = category ?? "All categories";
  const statusLabel = status ? STOCK_STATUS_LABEL[status] : "All statuses";
  const activeFiltersCount = (category ? 1 : 0) + (status ? 1 : 0);

  return (
    <>
      {/* Mobile toolbar below md */}
      <div className="p-md flex md:hidden w-full items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="text-text-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            ref={mobileInputRef}
            type="text"
            placeholder="Search name or SKU"
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="border-border-default bg-bg-surface text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:ring-border-focus/20 text-body h-11 w-full rounded-md border pr-3 pl-9 outline-none focus:ring-2"
          />
        </div>

        <ProductsFiltersSheet
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          category={category}
          status={status}
          sort={sort}
          dir={dir}
          categories={categories}
          activeFiltersCount={activeFiltersCount}
          onApply={handleApplyFilters}
        />
      </div>

      {/* Desktop toolbar from md up: untouched */}
      <div className="gap-md p-md hidden h-[60px] items-center md:flex">
        <div className="relative w-[288px]">
          <SearchIcon className="text-text-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            ref={desktopInputRef}
            type="text"
            placeholder="Search name or SKU"
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="border-border-default bg-bg-surface text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:ring-border-focus/20 text-body h-9 w-full rounded-md border pr-3 pl-9 outline-none focus:ring-2"
          />
        </div>

        <div className="w-[168px]">
          <Select value={category ?? ALL_OPTION} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-9 w-full justify-between">
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

        <div className="w-[152px]">
          <Select value={status ?? ALL_OPTION} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9 w-full justify-between">
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

        <div className="text-body-small text-text-secondary ml-auto whitespace-nowrap">
          {totalResults} results
        </div>
      </div>
    </>
  );
}
