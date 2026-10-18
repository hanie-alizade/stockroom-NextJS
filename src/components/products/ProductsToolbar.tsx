"use client";

import { useEffect, useRef } from "react";
import { SearchIcon } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StockStatus } from "@/types/product";
import { ALL_OPTION, STOCK_STATUS, STOCK_STATUS_LABEL } from "@/constants";
import { useDebouncedCallback } from "@/lib/client/useDebouncedCallback";

interface ProductsToolbarProps {
  search?: string;
  category?: string;
  status?: StockStatus;
  categories: { name: string }[];
  totalResults: number;
  onSearchChange: (q: string) => void;
  onCategoryChange: (category?: string) => void;
  onStatusChange: (status?: StockStatus) => void;
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
}: ProductsToolbarProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debouncedSearch = useDebouncedCallback(onSearchChange, 500);

  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement !== input && input.value !== search) {
      input.value = search;
    }
  }, [search]);

  const statusOptions = [
    { value: ALL_OPTION, label: "All statuses" },
    { value: STOCK_STATUS.IN_STOCK, label: STOCK_STATUS_LABEL[STOCK_STATUS.IN_STOCK] },
    { value: STOCK_STATUS.LOW, label: STOCK_STATUS_LABEL[STOCK_STATUS.LOW] },
    { value: STOCK_STATUS.OUT, label: STOCK_STATUS_LABEL[STOCK_STATUS.OUT] },
  ] as const;

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

  return (
    <div className="gap-md p-md flex h-[60px] items-center">
      <div className="relative w-[288px]">
        <SearchIcon className="text-text-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input
          ref={inputRef}
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
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>All categories</SelectItem>
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
            <SelectValue placeholder="All statuses" />
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
  );
}
