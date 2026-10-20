"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ALL_STORES } from "@/constants";
import { QueryErrorState } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/helpers";
import { ProductsTableHead } from "./ProductsTableHead";
import { ProductsTableRow } from "./ProductsTableRow";
import { ProductsTableSkeleton } from "./ProductsTableSkeleton";
import { ProductsEmptyState } from "./ProductsEmptyState";
import { ProductCardList } from "./ProductCardList";
import type {
  ProductListItem,
  ProductSortKey,
  SortDirection,
  StoreScope,
} from "@/types";

interface ProductsTableProps {
  items: ProductListItem[];
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  error?: Error | null;
  store: StoreScope;
  sort?: ProductSortKey;
  dir?: SortDirection;
  onSort: (column: ProductSortKey) => void;
  onRetry: () => void;
  // Selection
  isSelected: (id: string) => boolean;
  onToggleSelect: (item: ProductListItem) => void;
  isAllPageSelected: boolean;
  isPartiallyPageSelected: boolean;
  onTogglePage: () => void;
  // Filters
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function ProductsTable({
  items,
  isLoading,
  isFetching,
  isError,
  error,
  store,
  sort,
  dir,
  onSort,
  onRetry,
  isSelected,
  onToggleSelect,
  isAllPageSelected,
  isPartiallyPageSelected,
  onTogglePage,
  hasFilters,
  onClearFilters,
}: ProductsTableProps): React.ReactElement {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const storeParam = store && store !== ALL_STORES ? `?store=${store}` : "";

  const handleRowClick = (id: string): void => {
    router.push(`/products/${id}${storeParam}`);
  };

  const hasOldData = items.length > 0;
  const showErrorWithOldData = isError && hasOldData;
  const showErrorEmpty = isError && !hasOldData;
  const showLoading = isLoading && !hasOldData;
  const showEmpty = !isLoading && !isError && items.length === 0;

  return (
    <div className="flex flex-col">
      {showErrorWithOldData && (
        <QueryErrorState
          error={error}
          onRetry={onRetry}
          hasData={true}
          title="We couldn't load products"
          className="p-4 pb-0"
        />
      )}

      {/* Desktop & tablet table: hidden below md */}
      <div className="hidden md:block overflow-x-auto">
        <table
          aria-busy={isFetching ?? isLoading}
          className="w-full min-w-[900px] border-collapse text-left"
        >
          <ProductsTableHead
            sort={sort}
            dir={dir}
            onSort={onSort}
            isAllSelected={isAllPageSelected}
            isPartiallySelected={isPartiallyPageSelected}
            onToggleAll={onTogglePage}
          />

          <tbody className={showErrorWithOldData ? "opacity-60" : undefined}>
            {showLoading && <ProductsTableSkeleton />}

            {showEmpty && (
              <tr>
                <td colSpan={10} className="p-0">
                  <ProductsEmptyState
                    hasFilters={hasFilters}
                    onClearFilters={onClearFilters}
                  />
                </td>
              </tr>
            )}

            {!showLoading &&
              items.map((item) => (
                <ProductsTableRow
                  key={item.id}
                  item={item}
                  isSelected={isSelected(item.id)}
                  storeParam={storeParam}
                  now={now}
                  onSelect={onToggleSelect}
                  onRowClick={handleRowClick}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards: hidden from md up */}
      <div className={cn("md:hidden p-lg", showErrorWithOldData && "opacity-60")}>
        {showLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border-border-default bg-bg-surface flex flex-col gap-3 rounded-lg border p-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-4 rounded-sm" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="border-border-subtle grid grid-cols-3 gap-2 border-t pt-3">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {showEmpty && (
          <ProductsEmptyState
            hasFilters={hasFilters}
            onClearFilters={onClearFilters}
          />
        )}

        {!showLoading && (
          <ProductCardList
            items={items}
            isSelected={isSelected}
            storeParam={storeParam}
            onSelect={onToggleSelect}
            onCardClick={handleRowClick}
          />
        )}
      </div>

      {showErrorEmpty && (
        <QueryErrorState
          error={error}
          onRetry={onRetry}
          hasData={false}
          variant="section"
          title="We couldn't load products"
        />
      )}
    </div>
  );
}

