"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ALL_STORES } from "@/constants";
import { QueryErrorState } from "@/components/common";
import { ProductsTableHead } from "./ProductsTableHead";
import { ProductsTableRow } from "./ProductsTableRow";
import { ProductsTableSkeleton } from "./ProductsTableSkeleton";
import { ProductsEmptyState } from "./ProductsEmptyState";
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

      <div className="overflow-x-auto">
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

