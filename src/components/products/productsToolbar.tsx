"use client";

import { useState, useEffect, useRef } from "react";
import { SearchIcon } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StockStatus } from "@/lib/types/product";
import { productListQuerySchema } from "@/lib/domain/schemas";

const ALL_VALUE = "all";

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
  const [inputValue, setInputValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external search updates (e.g. browser back/forward or filter reset) during render
  if (search !== prevSearch) {
    setPrevSearch(search);
    setInputValue(search);
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setInputValue(nextValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(nextValue);
    }, 300);
  };

  return (
    <div className="gap-md p-lg flex items-center">
      <div className="relative w-[288px]">
        <SearchIcon className="text-text-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search name or SKU"
          value={inputValue}
          onChange={handleSearchChange}
          className="border-border-default bg-bg-surface text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:ring-border-focus/20 text-body h-9 w-full rounded-md border pr-3 pl-9 outline-none focus:ring-2"
        />
      </div>

      <div className="w-[168px]">
        <Select value={category || "all"} onValueChange={(val) => onCategoryChange(val)}>
          <SelectTrigger className="h-9 w-full justify-between">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => {
              const name = typeof cat === "string" ? cat : (cat as { name: string }).name;
              return (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[152px]">
        <Select
          value={status}
          onValueChange={(val) => onStatusChange(val as StockStatus | undefined)}
        >
          <SelectTrigger className="h-9 w-full justify-between">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="in_stock">In stock</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="out">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-body-small text-text-secondary ml-auto whitespace-nowrap">
        {totalResults} results
      </div>
    </div>
  );
}
