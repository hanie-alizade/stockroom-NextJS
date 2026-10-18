"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ALL_STORES } from "@/constants";
import { ApiError } from "@/api";
import { Banner } from "@/components/common";
import { StateBlock } from "@/components/common";
import { CircleAlertIcon } from "@/components/icons";
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

  const statusCode = error instanceof ApiError ? error.status ?? 500 : 500;

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
        <div className="p-4 pb-0">
          <Banner
            variant="danger"
            title="We couldn't load products"
            description={`The server returned an error (${statusCode}). Your data hasn't changed.`}
            actionText="Try again"
            onAction={onRetry}
          />
        </div>
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
        <div className="flex flex-col p-4">
          <Banner
            variant="danger"
            title="We couldn't load products"
            description={`The server returned an error (${statusCode}). Your data hasn't changed.`}
            actionText="Try again"
            onAction={onRetry}
          />
          <div className="mt-12 flex justify-center pb-12">
            <StateBlock
              icon={CircleAlertIcon}
              iconVariant="danger"
              title="Something went wrong"
              description="We couldn't load this page. Your data is safe."
              actionText="Try again"
              onAction={onRetry}
            />
          </div>
        </div>
      )}
    </div>
  );
}
